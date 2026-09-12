import { STATUS_STEPS } from "../lib/constants";

export default function Progress({ issue }) {
  const at = Math.max(0, STATUS_STEPS.indexOf(issue.status));
  return (
    <div className="flex justify-between gap-1 py-5">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="relative z-[1] flex w-full flex-col items-center text-center text-[9px] text-[#8c97a9]">
          <i className={`mb-1.5 block h-[17px] w-[17px] rounded-full ${i < at ? "bg-[#0f9b86] ring-4 ring-[#e1f6f1]" : i === at ? "bg-brand ring-4 ring-[#e4e8ff]" : "bg-[#dfe5ef]"}`} />
          <span className="leading-tight">{s}</span>
        </div>
      ))}
    </div>
  );
}