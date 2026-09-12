import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    mobile: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: [
        "citizen",
        "field_officer",
        "sub_department_officer",
        "department_head",
        "zone_authority",
        "municipal_admin",
      ],
      default: "citizen",
    },

    // Functional hierarchy
    department: {
      type: String,
      enum: [
        "Public Works",
        "Water & Sewerage",
        "Sanitation",
        "Electrical",
        "Traffic & Transport",
        null,
      ],
      default: null,
    },
    subDepartment: { type: String, default: null },

    // Geographical hierarchy
    ward: { type: String, default: null },
    zone: { type: String, default: null },

    // Escalation chain
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Nobody gets authority access without approval
    verificationStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "not_required",
    },
  },
  { timestamps: true },
);

// Non-citizen accounts always start out unverified, regardless of
// what's passed in — this can't be set directly through user input.
userSchema.pre("validate", function (next) {
  if (this.isNew) {
    this.verificationStatus = this.role === "citizen" ? "not_required" : "pending";
  }
  next();
});

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("User", userSchema);