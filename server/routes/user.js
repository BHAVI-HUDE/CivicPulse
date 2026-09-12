import { Router } from "express";
import User from "../models/User.js";

const router = Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, mobile, role, password } = req.body;

    if (!name || !email || !mobile || !role || !password) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already in use",
      });
    }

    const user = new User({
      name,
      email,
      mobile,
      role,
    });

    await user.setPassword(password);
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
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
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        ward: user.ward,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
});
export default router;

// router.post('/logout', (req, res) => {
  
//   res.status(200).json({ message: 'Logout successful' });
// });
