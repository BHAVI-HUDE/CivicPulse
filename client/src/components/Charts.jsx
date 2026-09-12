export function Bars({ counts = [] }) {
  const max = Math.max(1, ...counts);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="flex h-[220px] items-end justify-around border-b border-[#dfe5ee] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_48px,#edf0f5_49px)] px-5 pb-6">
      {days.map((d, i) => (
        <div className="flex h-full flex-col items-center justify-end gap-1" key={d}>
          <i className="w-[13px] rounded-t-[5px] bg-[#6178eb]" style={{ height: `${Math.max(4, ((counts[i] || 0) / max) * 100)}%` }} />
          <small className="mt-1 text-[10px] text-[#8794a9]">{d}</small>
        </div>
      ))}
    </div>
  );
}

export function Donut({ segments = [], total = 0 }) {
  let acc = 0;
  const stops = segments.length
    ? segments.map((s) => { const start = acc; acc += s.pct; return `${s.color} ${start}% ${acc}%`; }).join(",")
    : "#dfe4ef 0 100%";
  return (
    <div className="flex flex-wrap items-center gap-6 p-5">
      <div className="relative h-[132px] w-[132px] shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }}>
        <div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center font-display text-[15px] font-extrabold">
          {total}<br /><small className="text-[9px] font-semibold">Total issues</small>
        </div>
      </div>
      <div className="text-[11px] leading-8 text-[#67748a]">
        {segments.length
          ? segments.map((s) => <div key={s.label}><span style={{ color: s.color }}>●</span> {s.label} <b>{s.pct}%</b></div>)
          : <span>No issues yet.</span>}
      </div>
    </div>
  );
}