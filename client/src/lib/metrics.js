const CATEGORY_COLORS = { Road: "#3855e8", Water: "#0f9b86", Sanitation: "#f08b35", Streetlight: "#ffb020", Traffic: "#c04cd9", Other: "#9aa4bb" };

export function last7DayCounts(issues) {
  const days = Array(7).fill(0);
  const now = new Date();
  issues.forEach((i) => {
    if (!i.createdAt) return;
    const diffDays = Math.floor((now - new Date(i.createdAt)) / 86400000);
    if (diffDays >= 0 && diffDays < 7) days[6 - diffDays] += 1;
  });
  return days;
}

export function categoryMix(issues) {
  const counts = {};
  issues.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; });
  const total = issues.length || 1;
  return Object.entries(counts).map(([label, count]) => ({
    label,
    pct: Math.round((count / total) * 100),
    color: CATEGORY_COLORS[label] || "#9aa4bb",
  }));
}

export function avgResponseHours(issues) {
  const resolved = issues.filter((i) => ["Resolved", "Verified"].includes(i.status) && i.createdAt && i.updatedAt);
  if (!resolved.length) return null;
  const total = resolved.reduce((sum, i) => sum + (new Date(i.updatedAt) - new Date(i.createdAt)) / 36e5, 0);
  return total / resolved.length;
}

export function verificationRate(issues) {
  const decided = issues.filter((i) => i.verification === "Confirmed" || i.verification === "Reopened");
  if (!decided.length) return null;
  const confirmed = decided.filter((i) => i.verification === "Confirmed").length;
  return Math.round((confirmed / decided.length) * 100);
}

export function topHotspotWard(issues) {
  const active = issues.filter((i) => !["Resolved", "Verified"].includes(i.status));
  const counts = {};
  active.forEach((i) => { if (i.ward) counts[i.ward] = (counts[i.ward] || 0) + 1; });
  const [ward, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  return { ward, count };
}