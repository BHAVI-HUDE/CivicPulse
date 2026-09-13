import Backdrop from "../components/Backdrop";
import Section from "../components/Section";
import Metric from "../components/Metric";
import Progress from "../components/Progress";
import { issueRef, sevColor } from "../lib/constants";
import { resolutionDuration } from "../lib/metrics";

export default function FeedDetail({ issue, close }) {
  if (!issue) return null;
  const duration = resolutionDuration(issue);

  return (
    <>
      <Backdrop onClick={close} />
      <aside className="fixed right-0 top-[68px] z-50 h-[calc(100vh-68px)] w-full max-w-[430px] overflow-y-auto bg-white p-5 shadow-[-10px_0_40px_rgba(38,54,90,.13)]">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 font-display text-[19px] font-extrabold">{issue.title}</h2>
            <p className="my-1 text-[12px] text-[#7c899e]">
              {issueRef(issue)} · Reported {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
          <button onClick={close} className="h-7 w-7 shrink-0 rounded-[7px] bg-[#f1f3f8]">✕</button>
        </div>

        {issue.images?.length > 0 && (
          <Section title="Photos submitted">
            <div className="flex gap-2 overflow-x-auto">
              {issue.images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer">
                  <img src={src} alt={`Issue photo ${i + 1}`} className="h-20 w-20 shrink-0 rounded-[10px] border border-[#edf0f5] object-cover" />
                </a>
              ))}
            </div>
          </Section>
        )}

        <Section title="What was reported">
          <p className="text-[12px] leading-relaxed text-[#526078]">{issue.description}</p>
        </Section>

        <Section title="Who's handling it">
          <div className="grid grid-cols-2 gap-2">
            <Metric title="DEPARTMENT" value={issue.department || "Unassigned"} />
            <Metric title="WARD" value={issue.ward || "—"} />
          </div>
        </Section>

        <Section title="Resolution progress">
          <Progress issue={issue} />
        </Section>

        <Section title="Timeline">
          <div className="grid grid-cols-2 gap-2">
            <Metric title="REPORTED" value={issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "—"} />
            <Metric
              title={["Resolved", "Verified"].includes(issue.status) ? "TIME TO RESOLVE" : "STATUS"}
              value={duration || issue.status}
            />
          </div>
        </Section>

        <Section title="AI triage">
          <div className="grid grid-cols-3 gap-2">
            <Metric title="CATEGORY" value={issue.category} />
            <Metric title="SEVERITY" value={`${issue.severity ?? "—"} / 10`} />
            <Metric title="PRIORITY" value={`${issue.priorityScore}/100`} />
          </div>
          {issue.duplicateCount > 0 && (
            <p className="mt-2 text-[11px] text-[#8290a6]">
              {issue.duplicateCount} other citizen{issue.duplicateCount === 1 ? "" : "s"} independently reported this same issue.
            </p>
          )}
        </Section>

        {issue.verification === "Confirmed" && (
          <div className="mt-3 rounded-[10px] bg-[#e3f7f0] p-3 text-[12px] font-bold text-[#12806c]">
            ✓ The reporting citizen confirmed this fix worked.
          </div>
        )}
      </aside>
    </>
  );
}