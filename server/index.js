import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import issueRoutes from "./routes/issues.js";
import userRoutes from "./routes/user.js";
import { runEscalationSweep } from "./services/escalation.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL , credentials: true }));
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
  .then(() => {
    app.listen(port, () => console.log(`CivicPulse API listening on ${port}`));
    // Checks for SLA-breached issues every 5 minutes and escalates
    // them up the authority chain. Fine as an in-process interval at
    // hackathon scale; move to a real cron/queue for production.
    setInterval(
      () => runEscalationSweep().then((r) => {
        if (r.escalated) console.log(`Escalation sweep: ${r.escalated}/${r.checked} issues escalated`);
      }),
      5 * 60 * 1000,
    );
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
