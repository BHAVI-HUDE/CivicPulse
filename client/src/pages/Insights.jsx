import Heading from "../components/Heading";
import { Stat, Stats } from "../components/Stat";
import CardTitle from "../components/CardTitle";
import Map from "../components/Map";
import { avgResponseHours, verificationRate, topHotspotWard } from "../lib/metrics";

export default function Insights({ issues, tell }) {
  const avgHours = avgResponseHours(issues);
  const verifyPct = verificationRate(issues);
  const hotspot = topHotspotWard(issues);
  const duplicatesConsolidated = issues.reduce((sum, i) => sum + (i.duplicateCount || 0), 0);

  return (
    <>
      <Heading title="City insights" sub="Turn reports into evidence for better public services." action={<button className="ghost" onClick={() => tell("Insight report exported")}>⇩ Export report</button>} />
      <Stats>
        <Stat label="Average response time" value={avgHours != null ? `${avgHours.toFixed(1)}h` : "—"} detail="Reported → resolved" icon="◷" />
        <Stat label="Citizen verification" value={verifyPct != null ? `${verifyPct}%` : "—"} detail="Confirmed vs reopened" icon="✓" tone="green" />
        <Stat label="Duplicate clustering" value={duplicatesConsolidated} detail="Reports consolidated" icon="◌" tone="amber" />
        <Stat label="Top hotspot" value={hotspot.ward || "—"} detail={hotspot.ward ? `${hotspot.count} active issues` : "No active issues"} icon="🔥" tone="red" />
      </Stats>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.38fr_.95fr]">
        <div className="card">
          <CardTitle title={`${hotspot.ward || "City"} — civic hotspot map`} />
          <Map className="h-[330px] rounded-b-[14px]" issues={issues} />
        </div>
        <div className="card">
          <CardTitle title="AI impact summary" />
          <div className="space-y-2.5 p-5 pt-1">
            <div className="rounded-[8px] bg-[#f8f9fc] p-3 text-[12px] leading-relaxed text-[#526078]">
              <b>✦ AI triage coverage</b><br />{issues.filter((i) => i.aiRationale).length} of {issues.length} reports were classified with an AI rationale on file.
            </div>
            <div className="rounded-[8px] bg-[#f8f9fc] p-3 text-[12px] leading-relaxed text-[#526078]">
              <b>◉ {duplicatesConsolidated} duplicate reports clustered</b><br />Citizens' independent reports were merged into existing open issues instead of creating noise.
            </div>
            <div className="rounded-[8px] bg-[#f8f9fc] p-3 text-[12px] leading-relaxed text-[#526078]">
              <b>↗ Highest-risk ward</b><br />{hotspot.ward ? `${hotspot.ward} currently has the most active issues (${hotspot.count}).` : "No active issues to report on yet."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}