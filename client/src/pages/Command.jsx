import Heading from "../components/Heading";
import { Stat, Stats } from "../components/Stat";
import CardTitle from "../components/CardTitle";
import Map from "../components/Map";
import { Bars, Donut } from "../components/Charts";
import { last7DayCounts, categoryMix } from "../lib/metrics";

export default function Command({ issues, stats, queue, insights, open }) {
  const active = issues.filter((i) => !["Resolved", "Verified"].includes(i.status));

  return (
    <>
      <Heading
        title="City command center"
        sub="One view to move from incoming signal to verified public impact."
        action={<div className="flex flex-wrap gap-2"><button className="ghost">Today</button><button className="ghost">All wards</button></div>}
      />
      <Stats>
        <Stat label="Critical issues" value={stats.critical} detail="Priority ≥ 80" icon="🔥" tone="red" />
        <Stat label="Awaiting assignment" value={issues.filter((i) => i.status === "Analyzed").length} detail="Needs attention" icon="◷" tone="amber" />
        <Stat label="In progress" value={stats.active} detail="Currently active" icon="◌" />
        <Stat label="Overdue (SLA breached)" value={stats.overdue} detail="Escalation may apply" icon="⚠" tone="red" />
      </Stats>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.38fr_.95fr]">
        <div className="card">
          <CardTitle title="Priority queue" link="Manage queue →" onClick={queue} />
          <div className="px-5 pb-4">
            {active.slice(0, 4).map((i) => (
              <button key={i._id} onClick={() => open(i)} className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-2 border-b border-[#edf0f5] py-3 text-left last:border-0">
                <b className="grid h-[31px] w-[31px] place-items-center rounded-[9px] bg-[#fff0ef] font-display text-[13px] text-[#d95357]">{i.priorityScore}</b>
                <span className="min-w-0">
                  <b className="block truncate text-[12px]">{i.title}</b>
                  <small className="mt-0.5 block truncate text-[10px] text-[#8894a7]">{i.department} · {i.duplicateCount || 0} duplicate reports · {i.ward}</small>
                </span>
                <span className={`badge ${i.priorityScore >= 85 ? "bg-[#ffeaec] text-[#cc3d47]" : "bg-[#fff3db] text-[#b37410]"}`}>
                  {i.priorityScore >= 85 ? "Critical" : "High"}
                </span>
              </button>
            ))}
            {!active.length && <p className="py-6 text-center text-[13px] text-[#8490a3]">No active issues right now.</p>}
          </div>
        </div>
        <div className="card">
          <CardTitle title="Live civic hotspots" link="Explore map →" onClick={insights} />
          <Map className="h-[245px] rounded-b-[14px]" issues={issues} />
        </div>
        <div className="card">
          <CardTitle title="Issue volume · last 7 days" />
          <Bars counts={last7DayCounts(issues)} />
        </div>
        <div className="card">
          <CardTitle title="Category mix" link="Full analytics →" onClick={insights} />
          <Donut segments={categoryMix(issues)} total={issues.length} />
        </div>
      </div>
    </>
  );
}