import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Municipal Admin";

  if (!email || !password) {
    console.error("Usage: node scripts/seedAdmin.js <email> <password> [name]");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.error("A user with that email already exists.");
    process.exit(1);
  }

  const admin = new User({
    name,
    email,
    mobile: "0000000000",
    role: "municipal_admin",
  });
  await admin.setPassword(password);
  admin.verificationStatus = "approved"; // bypasses the pre-validate hook's default
  await admin.save();

  console.log(`Created municipal_admin: ${admin.email} (id: ${admin._id})`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});