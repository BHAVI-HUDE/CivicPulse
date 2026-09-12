import Heading from "../components/Heading";
import CardTitle from "../components/CardTitle";
import IssueTable from "../components/IssueTable";
import Progress from "../components/Progress";

export default function Tracking({ issues, report, verify }) {
  const resolved = issues.find((i) => i.status === "Resolved" && i.verification === "Awaiting");
  const focus = issues[0];

  return (
    <>
      <Heading title="My reports" sub="Follow every issue from first report to verified resolution." action={<button className="primary" onClick={report}>＋ Report an issue</button>} />
      <div className="card"><IssueTable issues={issues} /></div>

      {focus && (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.38fr_.95fr]">
          <div className="card">
            <CardTitle title={`${focus.title} · Resolution progress`} />
            <div className="px-5 pb-5">
              <Progress issue={focus} />
              <div className="rounded-[8px] bg-[#f8f9fc] p-3 text-[12px] leading-relaxed text-[#526078]">
                {focus.department} is handling this report. Current status: <b>{focus.status}</b>.
              </div>
            </div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-[44px]">🙌</div>
            <h2 className="m-1 font-display text-[18px] font-extrabold">Was this fixed?</h2>
            <p className="mx-auto mb-4 max-w-[390px] text-[12px] text-[#718097]">
              {resolved ? `"${resolved.title}" was marked resolved. Let us know whether the fix worked.` : "We’ll ask you to confirm here as soon as one of your reports is marked resolved."}
            </p>
            {resolved ? (
              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => verify(resolved, true)} className="rounded-[9px] bg-[#e3f7f0] px-4 py-2.5 text-[12px] font-extrabold text-[#12806c]">👍 Yes, fixed</button>
                <button onClick={() => verify(resolved, false)} className="rounded-[9px] bg-[#ffebed] px-4 py-2.5 text-[12px] font-extrabold text-[#ce4651]">👎 Not yet</button>
              </div>
            ) : (
              <small className="text-[#718097]">No reports are waiting for verification.</small>
            )}
          </div>
        </div>
      )}
      {!issues.length && <p className="mt-4 text-center text-[13px] text-[#8490a3]">You haven’t reported anything yet.</p>}
    </>
  );
}