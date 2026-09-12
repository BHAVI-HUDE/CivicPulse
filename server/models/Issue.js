import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Road", "Water", "Sanitation", "Streetlight", "Traffic", "Other"],
      default: "Other",
    },
    severity: { type: Number, min: 1, max: 10, default: 5 },
    priorityScore: { type: Number, min: 0, max: 100, default: 50 },
    duplicateCount: { type: Number, default: 0 },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Issue", default: null },
    aiRationale: { type: String, default: "" },
    aiConfidence: { type: Number, min: 0, max: 1, default: null },

    // Functional routing — now structured instead of a free-text label
    department: {
      type: String,
      enum: [
        "Public Works",
        "Water & Sewerage",
        "Sanitation",
        "Electrical",
        "Traffic & Transport",
        "General Civic Services",
      ],
      default: "General Civic Services",
    },
    subDepartment: { type: String, default: null },

    status: {
      type: String,
      enum: ["Reported", "Analyzed", "Assigned", "In progress", "Resolved", "Verified"],
      default: "Reported",
    },
    ward: { type: String, default: "Ward 14" },
    location: {
      address: { type: String, trim: true, default: "" },
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    images: [{ type: String }],
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reporterName: { type: String, default: "Citizen" },
    verification: {
      type: String,
      enum: ["Awaiting", "Confirmed", "Reopened"],
      default: "Awaiting",
    },

    // Accountability chain
    assignedAuthorityId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    slaDeadline: { type: Date, default: null },
    // 0 = original officer, 1 = dept head, 2 = zone authority, 3 = municipal admin
    escalationLevel: { type: Number, min: 0, max: 3, default: 0 },
    escalationHistory: [
      {
        level: Number,
        authorityId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        escalatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Issue", issueSchema);