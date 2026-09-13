import { useState } from "react";
import { ICON, statusColor, issueRef, sevColor } from "../lib/constants";

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export default function FeedCard({ issue, open }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = issue.images || [];

  return (
    <article
      onClick={() => open(issue)}
      className="card mb-4 cursor-pointer overflow-hidden transition-shadow hover:shadow-[0_8px_24px_rgba(38,54,90,.1)]"
    >
      {/* Header — who/what/when, like a post byline */}
      <div className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff1e8] text-[18px]">
          {ICON[issue.category] || "◌"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <b className="text-[13px]">{issue.category || "Uncategorized"}</b>
            <span className="text-[11px] text-[#8290a6]">· {issue.ward || "Unknown ward"}</span>
          </div>
          <small className="block text-[11px] text-[#8290a6]">
            {issueRef(issue)} · {timeAgo(issue.createdAt)}
          </small>
        </div>
        <span className={`badge ${statusColor(issue.status)}`}>{issue.status}</span>
      </div>

      {/* Media — the "post" feel. Swap/extend this block later for video:
          check issue.video first and render a <video> tag before falling
          back to the image carousel below. */}
      {images.length > 0 && (
        <div className="relative bg-[#0c1730]">
          <img
            src={images[activeImage]}
            alt={issue.title}
            className="max-h-[420px] w-full object-cover"
          />
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-1.5 w-1.5 rounded-full ${i === activeImage ? "bg-white" : "bg-white/40"}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body — title + description, like a post caption */}
      <div className="p-4">
        <h3 className="mb-1 font-display text-[15px] font-extrabold">{issue.title}</h3>
        <p className="mb-3 text-[13px] leading-relaxed text-[#4d5d76]">{issue.description}</p>

        {/* Footer stats — engagement-style row, but honest metrics */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#edf0f5] pt-3 text-[11px] text-[#748198]">
          <span className={`font-bold ${sevColor(issue.priorityScore)}`}>
            ⚑ Priority {issue.priorityScore}/100
          </span>
          <span>🏢 {issue.department || "Unassigned"}</span>
          {issue.duplicateCount > 0 && (
            <span>📍 {issue.duplicateCount} other{issue.duplicateCount === 1 ? "" : "s"} reported this nearby</span>
          )}
          {issue.verification === "Confirmed" && <span className="font-bold text-[#15816e]">✓ Citizen-verified fixed</span>}
        </div>
      </div>
    </article>
  );
}