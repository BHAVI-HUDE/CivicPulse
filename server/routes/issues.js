// AFTER
import { Router } from "express";
import Issue from "../models/Issue.js";
import { classifyAndScoreIssue, findDuplicateIssue, estimateSeverityFallback } from "../services/aiService.js";
import { uploadIssueImages } from "../services/cloudinaryService.js";
import upload from "../middleware/upload.js";

const router = Router();

// Citizen report form uploads photos here first and gets back
// Cloudinary URLs, which it then includes as `images` on the
// POST /api/issues payload. Kept as a separate step (rather than
// one multipart POST) so the existing JSON issue-creation flow,
// AI triage, and duplicate detection don't need to change shape.
router.post("/upload", upload.array("images", 3), async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "No image files were provided." });
    }
    const urls = await uploadIssueImages(req.files);
    res.status(201).json({ images: urls });
  } catch (error) {
    next(error);
  }
});

const routing = {
  Road: "Road Maintenance",
  Water: "Water Department",
  Sanitation: "Sanitation",
  Streetlight: "Electrical Services",
  Traffic: "Traffic Control",
  Other: "Civic Operations",
};
const classify = (description = "") => {
  const text = description.toLowerCase();
  if (/pothole|road|street/.test(text)) return "Road";
  if (/water|leak|drain/.test(text)) return "Water";
  if (/garbage|waste|trash/.test(text)) return "Sanitation";
  if (/light|lamp/.test(text)) return "Streetlight";
  if (/signal|traffic/.test(text)) return "Traffic";
  return "Other";
};

router.get("/", async (req, res, next) => {
  try {
    res.json(await Issue.find().sort({ priorityScore: -1, createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const issues = await Issue.find();
    res.json({
      total: issues.length,
      critical: issues.filter(
        (i) =>
          i.priorityScore >= 80 && !["Resolved", "Verified"].includes(i.status),
      ).length,
      inProgress: issues.filter((i) => i.status === "In progress").length,
      resolved: issues.filter((i) =>
        ["Resolved", "Verified"].includes(i.status),
      ).length,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const latitude = Number(req.body.location?.latitude);
    const longitude = Number(req.body.location?.longitude);
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        message: "Pin the issue location on the map before submitting.",
      });
    }
   // AI-assisted classification + severity, with a deterministic fallback
// if the AI is unconfigured, times out, or returns something we can't trust.
const aiResult = req.body.category
  ? null
  : await classifyAndScoreIssue(req.body.description);
const category = req.body.category || aiResult?.category || classify(req.body.description);
// Severity is never taken from the citizen's form — it's AI-derived
// (with a keyword-based fallback) so it can't be gamed by everyone
// picking 10, and stays consistent across reports for the queue to
// actually mean something.
const severity = aiResult?.severity || estimateSeverityFallback(req.body.description);

// Duplicate detection: only check against other open reports in the
// same ward + category, so the AI has a small, relevant candidate set.
const ward = req.body.ward || "Ward 14";
const candidates = await Issue.find({
  ward,
  category,
  status: { $nin: ["Resolved", "Verified"] },
})
  .select("title description")
  .limit(10);

const duplicate = await findDuplicateIssue(req.body.description, candidates);

if (duplicate) {
  const matched = await Issue.findByIdAndUpdate(
    duplicate.issueId,
    { $inc: { duplicateCount: 1 } },
    { new: true },
  );
  matched.priorityScore = Math.min(
    100,
    Math.round(matched.severity * 7 + matched.duplicateCount * 3 + (matched.nearSchool ? 10 : 0)),
  );
  await matched.save();
  return res.status(200).json({ ...matched.toObject(), isDuplicate: true });
}

const duplicateCount = Number(req.body.duplicateCount || 0);
const priorityScore = Math.min(
  100,
  Math.round(
    severity * 7 + duplicateCount * 3 + (req.body.nearSchool ? 10 : 0),
  ),
);
const issue = await Issue.create({
  ...req.body,
  location: {
    address: req.body.location?.address || "",
    latitude,
    longitude,
  },
  category,
  severity,
  duplicateCount,
  priorityScore,
  department: routing[category],
  status: "Analyzed",
  aiRationale: aiResult?.rationale || "",
  aiConfidence: aiResult?.confidence ?? null,
});
res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/verify", async (req, res, next) => {
  try {
    const confirmed = Boolean(req.body.confirmed);
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        verification: confirmed ? "Confirmed" : "Reopened",
        status: confirmed ? "Verified" : "In progress",
      },
      { new: true },
    );
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

export default router;
