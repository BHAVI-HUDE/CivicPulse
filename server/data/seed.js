import "dotenv/config";
import mongoose from "mongoose";
import Issue from "../models/Issue.js";

const seed = [
  {
    title: "Deep pothole near Maple School",
    description:
      "Large pothole beside the school gate is dangerous for children and two-wheelers.",
    category: "Road",
    severity: 9,
    priorityScore: 94,
    duplicateCount: 7,
    department: "Road Maintenance",
    status: "In progress",
    ward: "Ward 14",
    location: {
      address: "Maple School Gate, Ward 14",
      latitude: 23.0302,
      longitude: 72.5661,
    },
  },
  {
    title: "Major water leakage, Park Road",
    description: "Water is leaking continuously onto Park Road.",
    category: "Water",
    severity: 9,
    priorityScore: 89,
    duplicateCount: 5,
    department: "Water Department",
    status: "Assigned",
    ward: "Ward 12",
    location: {
      address: "Park Road, Ward 12",
      latitude: 23.0183,
      longitude: 72.5771,
    },
  },
  {
    title: "Garbage overflow at Central Market",
    description: "Overflowing waste bins are blocking the market lane.",
    category: "Sanitation",
    severity: 8,
    priorityScore: 83,
    duplicateCount: 9,
    department: "Sanitation",
    status: "Analyzed",
    ward: "Ward 14",
    location: {
      address: "Central Market, Ward 14",
      latitude: 23.0255,
      longitude: 72.5604,
    },
  },
  {
    title: "Streetlight not working",
    description: "Streetlight has been off for three nights.",
    category: "Streetlight",
    severity: 5,
    priorityScore: 56,
    duplicateCount: 1,
    department: "Electrical Services",
    status: "Resolved",
    ward: "Ward 14",
    location: {
      address: "Lake Avenue, Ward 14",
      latitude: 23.0128,
      longitude: 72.5696,
    },
  },
];

await mongoose.connect(
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/civicpulse",
);
await Issue.deleteMany({});
await Issue.insertMany(seed);
console.log(`Seeded ${seed.length} CivicPulse issues`);
await mongoose.disconnect();
