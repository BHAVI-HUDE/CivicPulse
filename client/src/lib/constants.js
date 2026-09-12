// Every value here must stay in lockstep with the Mongoose enums in
// server/models/Issue.js and server/models/User.js. If the backend enum
// changes, update it here — nowhere else in the client hardcodes these lists.

export const CATEGORIES = ["Road", "Water", "Sanitation", "Streetlight", "Traffic", "Other"];

// Matches Issue.department enum
export const DEPARTMENTS = [
  "Public Works",
  "Water & Sewerage",
  "Sanitation",
  "Electrical",
  "Traffic & Transport"
];

// Matches Issue.status enum
export const STATUS_STEPS = ["Reported", "Analyzed", "Assigned", "In progress", "Resolved", "Verified"];

// Matches User.role enum
export const ROLES = [
  { value: "citizen", label: "Citizen", requiresDepartment: false },
  { value: "field_officer", label: "Field officer", requiresDepartment: true },
  { value: "sub_department_officer", label: "Sub-department officer", requiresDepartment: true },
  { value: "department_head", label: "Department head", requiresDepartment: true },
  { value: "zone_authority", label: "Zone authority", requiresDepartment: true },
  { value: "municipal_admin", label: "Municipal admin", requiresDepartment: true },
];

// Matches ROLE_RANK in server/middleware/auth.js
export const ROLE_RANK = {
  citizen: 0,
  field_officer: 1,
  sub_department_officer: 2,
  department_head: 3,
  zone_authority: 4,
  municipal_admin: 5,
};

export const isAuthorityRole = (role) => Boolean(role) && role !== "citizen";
export const canManageIssues = (role) => (ROLE_RANK[role] ?? -1) >= ROLE_RANK.sub_department_officer;
export const isMunicipalAdmin = (role) => role === "municipal_admin";

export const ICON = { Road: "🕳️", Water: "💧", Sanitation: "🗑️", Streetlight: "💡", Traffic: "🚦" };

export const statusColor = (s) =>
  ({
    "In progress": "bg-[#e9f0ff] text-[#3d63cb]",
    Resolved: "bg-[#e2f7f1] text-[#15816e]",
    Verified: "bg-[#e2f7f1] text-[#15816e]",
    Assigned: "bg-[#fff3db] text-[#b37410]",
    Analyzed: "bg-[#ffeaec] text-[#cc3d47]",
    Reported: "bg-[#ffeaec] text-[#cc3d47]",
  })[s] || "bg-slate-100 text-slate-600";

export const sevColor = (n) => (n >= 85 ? "text-[#d84b52]" : n >= 70 ? "text-[#de971c]" : "text-[#139b83]");

export const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "U";

// Real Mongo _id-based reference instead of the old fabricated
// "CP-2026-10<priorityScore>" string.
export const issueRef = (issue) => {
  const tail = String(issue?._id || "").slice(-4).toUpperCase();
  return `CP-2026-${tail || "0000"}`;
};