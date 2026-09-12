import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate, loadCurrentUser, requireMinRole, ROLE_RANK } from "../middleware/auth.js";

const router = Router();

const ALLOWED_ROLES = [
  "citizen",
  "field_officer",
  "sub_department_officer",
  "department_head",
  "zone_authority",
  "municipal_admin",
];

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, mobile, role, password, department, subDepartment, ward, zone } = req.body;

    if (!name || !email || !mobile || !role || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (role !== "citizen" && !department) {
      return res.status(400).json({ message: "Department is required for authority roles" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = new User({
      name,
      email,
      mobile,
      role,
      department: department || null,
      subDepartment: subDepartment || null,
      ward: ward || null,
      zone: zone || null,
    });
    await user.setPassword(password);
    await user.save();

    res.status(201).json({
      message:
        user.verificationStatus === "pending"
          ? "Account created. Awaiting verification by a higher authority."
          : "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        subDepartment: user.subDepartment,
        ward: user.ward,
        zone: user.zone,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.verificationStatus === "pending") {
      return res.status(403).json({ message: "Your account is awaiting verification by a higher authority." });
    }
    if (user.verificationStatus === "rejected") {
      return res.status(403).json({ message: "Your registration was rejected." });
    }

    res.status(200).json({
      message: "Login successful",
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        subDepartment: user.subDepartment,
        ward: user.ward,
        zone: user.zone,
        reportsTo: user.reportsTo,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

// --- Everything below requires a valid token ---

router.get("/pending", authenticate, loadCurrentUser, requireMinRole("field_officer"), async (req, res, next) => {
  try {
    const { department, ward } = req.query;
    const filter = { verificationStatus: "pending" };
    if (department) filter.department = department;
    if (ward) filter.ward = ward;

    const pending = await User.find(filter).select("-passwordHash");
    res.json(pending);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/approve", authenticate, loadCurrentUser, async (req, res, next) => {
  try {
    const approver = req.currentUser;
    const target = await User.findById(req.params.id);

    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.verificationStatus !== "pending") {
      return res.status(400).json({ message: "User is not pending verification" });
    }
    if (ROLE_RANK[approver.role] <= ROLE_RANK[target.role]) {
      return res.status(403).json({ message: "You do not have authority to approve this role" });
    }

    target.verificationStatus = "approved";
    target.reportsTo = req.body.reportsTo || approver._id;
    await target.save();

    res.json({
      message: "User approved",
      user: {
        id: target._id,
        name: target.name,
        role: target.role,
        department: target.department,
        subDepartment: target.subDepartment,
        ward: target.ward,
        reportsTo: target.reportsTo,
        verificationStatus: target.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reject", authenticate, loadCurrentUser, async (req, res, next) => {
  try {
    const approver = req.currentUser;
    const target = await User.findById(req.params.id);

    if (!target) return res.status(404).json({ message: "User not found" });
    if (ROLE_RANK[approver.role] <= ROLE_RANK[target.role]) {
      return res.status(403).json({ message: "You do not have authority to reject this role" });
    }

    target.verificationStatus = "rejected";
    await target.save();

    res.json({ message: "User rejected", reason: req.body.reason || null });
  } catch (error) {
    next(error);
  }
});

// Returns the logged-in user's own profile — useful for the frontend
// to re-hydrate state on refresh from a stored token.
router.get("/me", authenticate, loadCurrentUser, async (req, res) => {
  const { passwordHash, ...safeUser } = req.currentUser.toObject();
  res.json(safeUser);
});

export default router;