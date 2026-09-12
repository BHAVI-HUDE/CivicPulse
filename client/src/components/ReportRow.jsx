import { ICON, statusColor, issueRef } from "../lib/constants";

export default function ReportRow({ issue }) {
  return (
    <div className="grid grid-cols-[37px_1fr_auto] items-center gap-2.5 border-b border-[#edf0f5] py-3.5 last:border-0">
      <div className="grid h-[35px] w-[35px] place-items-center rounded-[10px] bg-[#fff1e8]">
        {ICON[issue.category] || "◌"}
      </div>
      <div className="min-w-0">
        <b className="block truncate text-[13px]">{issue.title}</b>
        <small className="mt-0.5 block truncate text-[11px] text-[#8290a6]">
          {issueRef(issue)} · {issue.duplicateCount || 0} nearby reports
        </small>
      </div>
      <span className={`badge ${statusColor(issue.status)}`}>{issue.status}</span>
    </div>
  );
}