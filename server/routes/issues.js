import { Router } from "express";
import Issue from "../models/Issue.js";
import User from "../models/User.js";
import { classifyAndScoreIssue, findDuplicateIssue, estimateSeverityFallback } from "../services/aiService.js";
import { uploadIssueImages } from "../services/cloudinaryService.js";
import upload from "../middleware/upload.js";
import { authenticate, loadCurrentUser, requireMinRole } from "../middleware/auth.js";

const router = Router();

router.post("/upload", authenticate, upload.array("images", 3), async (req, res, next) => {
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
  Road: { department: "Public Works", subDepartment: "Roads & Potholes" },
  Water: { department: "Water & Sewerage", subDepartment: "Water Supply" },
  Sanitation: { department: "Sanitation", subDepartment: "Garbage Collection" },
  Streetlight: { department: "Electrical", subDepartment: "Street Lighting" },
  Traffic: { department: "Traffic & Transport", subDepartment: "Traffic Signals" },
  Other: { department: "General Civic Services", subDepartment: "Other Civic Issues" },
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

const slaHoursForPriority = (priorityScore) => {
  if (priorityScore >= 80) return 24;
  if (priorityScore >= 50) return 48;
  return 72;
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
        (i) => i.priorityScore >= 80 && !["Resolved", "Verified"].includes(i.status),
      ).length,
      inProgress: issues.filter((i) => i.status === "In progress").length,
      resolved: issues.filter((i) => ["Resolved", "Verified"].includes(i.status)).length,
      overdue: issues.filter(
        (i) => i.slaDeadline && i.slaDeadline < new Date() && !["Resolved", "Verified"].includes(i.status),
      ).length,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, loadCurrentUser, async (req, res, next) => {
  try {
    const latitude = Number(req.body.location?.latitude);
    const longitude = Number(req.body.location?.longitude);
    if (
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    ) {
      return res.status(400).json({ message: "Pin the issue location on the map before submitting." });
    }

    const aiResult = req.body.category ? null : await classifyAndScoreIssue(req.body.description);
    const category = req.body.category || aiResult?.category || classify(req.body.description);
    const severity = aiResult?.severity || estimateSeverityFallback(req.body.description);

    const ward = req.body.ward || "Ward 14";
    const candidates = await Issue.find({
      ward,
      category,
      status: { $nin: ["Resolved", "Verified"] },
    }).select("title description").limit(10);

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
      Math.round(severity * 7 + duplicateCount * 3 + (req.body.nearSchool ? 10 : 0)),
    );

    const { department, subDepartment } = routing[category];

    const assignedAuthority = await User.findOne({
      role: "sub_department_officer",
      department,
      ward,
      verificationStatus: "approved",
    }).select("_id");

    const slaHours = slaHoursForPriority(priorityScore);
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const issue = await Issue.create({
      ...req.body,
      location: { address: req.body.location?.address || "", latitude, longitude },
      category,
      severity,
      duplicateCount,
      priorityScore,
      department,
      subDepartment,
      assignedAuthorityId: assignedAuthority?._id || null,
      slaDeadline,
      escalationLevel: 0,
      status: assignedAuthority ? "Assigned" : "Analyzed",
      aiRationale: aiResult?.rationale || "",
      aiConfidence: aiResult?.confidence ?? null,
      // Trust the verified session, not whatever the client sent.
      reporterId: req.currentUser._id,
      reporterName: req.currentUser.name,
    });
    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id",
  authenticate,
  loadCurrentUser,
  requireMinRole("sub_department_officer"),
  async (req, res, next) => {
    try {
      const issue = await Issue.findById(req.params.id);
      if (!issue) return res.status(404).json({ message: "Issue not found" });

      const isSameDepartment = req.currentUser.department === issue.department;
      const isMunicipalAdmin = req.currentUser.role === "municipal_admin";

      if (!isSameDepartment && !isMunicipalAdmin) {
        return res.status(403).json({ message: "This issue is outside your department" });
      }

      const updated = await Issue.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

router.post("/:id/verify", authenticate, loadCurrentUser, async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (String(issue.reporterId) !== String(req.currentUser._id)) {
      return res.status(403).json({ message: "Only the original reporter can verify this issue" });
    }

    const confirmed = Boolean(req.body.confirmed);
    issue.verification = confirmed ? "Confirmed" : "Reopened";
    issue.status = confirmed ? "Verified" : "In progress";
    await issue.save();
    res.json(issue);
  } catch (error) {
    next(error);
  }
});

export default router;