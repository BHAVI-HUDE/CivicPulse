import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import issueRoutes from "./routes/issues.js";
import userRoutes from "./routes/user.js";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);
app.use((err, _req, res, _next) =>
  res.status(400).json({ message: err.message || "Request failed" }),
);

const port = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() =>
    app.listen(port, () => console.log(`CivicPulse API listening on ${port}`)),
  )
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
