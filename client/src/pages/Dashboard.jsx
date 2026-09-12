import Heading from "../components/Heading";
import { Stat, Stats } from "../components/Stat";
import CardTitle from "../components/CardTitle";
import ReportRow from "../components/ReportRow";
import Map from "../components/Map";

export default function Dashboard({ user, issues, stats, report, tracking }) {
  return (
    <>
      <Heading
        title={<>Good morning, {user?.name || "there"} 👋</>}
        sub="Here’s the pulse of your neighbourhood today."
        action={<button className="primary" onClick={report}>＋ Report an issue</button>}
      />
      <Stats>
        <Stat label="My reports" value={stats.total} detail="Total submitted" icon="◫" />
        <Stat label="In progress" value={stats.active} detail="Being handled" icon="◌" tone="amber" />
        <Stat label="Resolved" value={stats.resolved} detail="Marked resolved" icon="✓" tone="green" />
        <Stat label="Needs verification" value={stats.needsVerification} detail="Action needed" icon="!" tone="red" />
      </Stats>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.38fr_.95fr]">
        <div className="card">
          <CardTitle title="Recent reports" link="View all →" onClick={tracking} />
          <div className="px-5 pb-2">
            {issues.slice(0, 3).map((i) => <ReportRow key={i._id} issue={i} />)}
            {!issues.length && <p className="py-6 text-center text-[13px] text-[#8490a3]">No reports yet.</p>}
          </div>
        </div>
        <div className="card">
          <CardTitle title="Quick actions" />
          <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
            {[["＋", "New report", report], ["◌", "Track reports", tracking], ["?", "Help center", null]].map(([i, t, c]) => (
              <button key={t} onClick={c} className="rounded-[10px] border border-[#e7ebf2] bg-[#fafbfe] px-1.5 py-3 text-[11px] font-bold text-[#526076]">
                <span className="mb-1 block text-[18px]">{i}</span>{t}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <CardTitle title="Your neighbourhood" />
          <Map className="h-[245px] rounded-b-[14px]" issues={issues} />
        </div>
        <div className="card">
          <CardTitle title="Recent activity" />
          <div className="px-5 pb-5">
            {issues.slice(0, 3).map((i) => (
              <div className="grid grid-cols-[28px_1fr] gap-2 py-2.5" key={i._id}>
                <span className="grid h-[21px] w-[21px] place-items-center rounded-full bg-[#e6ebff] text-[10px] text-brand">✦</span>
                <div className="min-w-0">
                  <b className="text-[12px]">{i.status}</b>
                  <small className="mt-0.5 block truncate text-[11px] text-[#8490a6]">{i.title}</small>
                </div>
              </div>
            ))}
            {!issues.length && <p className="text-center text-[13px] text-[#8490a3]">Nothing to show yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}