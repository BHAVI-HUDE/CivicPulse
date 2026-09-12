import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies the Bearer token and attaches the decoded payload to
// req.user (id, role — enough for quick checks without a DB hit).
export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Loads the fresh DB record onto req.currentUser. Use this whenever a
// route needs up-to-date role/verificationStatus rather than trusting
// whatever was true when the token was issued (e.g. someone approved
// or demoted after login).
export async function loadCurrentUser(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export const ROLE_RANK = {
  citizen: 0,
  field_officer: 1,
  sub_department_officer: 2,
  department_head: 3,
  zone_authority: 4,
  municipal_admin: 5,
};

// Gate a route to a minimum role rank (e.g. requireMinRole("field_officer")
// lets anyone except plain citizens through).
export function requireMinRole(minRole) {
  return (req, res, next) => {
    const rank = ROLE_RANK[req.currentUser?.role ?? req.user?.role];
    if (rank === undefined || rank < ROLE_RANK[minRole]) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}