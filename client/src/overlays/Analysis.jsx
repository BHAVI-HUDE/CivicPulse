import Metric from "../components/Metric";

// Now takes the actual created `issue` — previously this always showed
// hardcoded demo numbers regardless of what the AI actually returned.
export default function Analysis({ issue, close, go }) {
  if (!issue) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17223d88] p-4" onClick={close}>
      <div className="relative w-full max-w-[600px] rounded-[18px] bg-white p-7 text-center shadow-[0_20px_70px_#101a32]" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-4 top-4 h-7 w-7 rounded-[7px] bg-[#f1f3f8]">✕</button>
        <div className="mx-auto grid h-[65px] w-[65px] place-items-center rounded-[20px] bg-gradient-to-br from-[#546cec] to-[#8961e5] text-[30px] text-white shadow-[0_8px_25px_#c2c8ff]">✦</div>
        <h2 className="mb-1 mt-3 font-display text-[21px] font-extrabold">AI analysis complete</h2>
        <p className="mb-5 text-[12px] text-[#718097]">Your report is now a structured, actionable civic issue.</p>
        <div className="grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
          <Metric title="DETECTED CATEGORY" value={issue.category} />
          <Metric title="SEVERITY" value={`${issue.severity ?? "—"} / 10`} />
          <Metric title="CONFIDENCE" value={issue.aiConfidence != null ? `${Math.round(issue.aiConfidence * 100)}%` : "—"} />
          <Metric title="PRIORITY SCORE" value={`${issue.priorityScore} / 100${issue.priorityScore >= 80 ? " 🔥" : ""}`} />
          <Metric title="DUPLICATES FOUND" value={issue.isDuplicate ? "Matched an existing report" : `${issue.duplicateCount || 0} nearby reports`} />
          <Metric title="ROUTED TO" value={issue.department} />
          {issue.aiRationale && (
            <div className="col-span-2 rounded-[10px] border border-[#edf0f5] bg-[#f8f9fd] p-3 sm:col-span-3">
              <label className="text-[10px] font-bold text-[#8591a5]">AI REASONING</label>
              <b className="mt-1 block text-[12px] leading-relaxed">{issue.aiRationale}</b>
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button onClick={() => { close(); go("tracking"); }} className="ghost">View my report</button>
          <button onClick={() => { close(); go("dashboard"); }} className="primary">Done ✓</button>
        </div>
      </div>
    </div>
  );
}