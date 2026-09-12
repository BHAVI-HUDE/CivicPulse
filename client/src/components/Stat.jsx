export function Stat({ label, value, detail, icon, tone = "blue" }) {
  const bg = { blue: "#e9eeff", amber: "#fff2dd", green: "#e2f7f1", red: "#ffeaec" }[tone];
  const col = { blue: "#3855e8", amber: "#b77b1d", green: "#15816e", red: "#d34c55" }[tone];
  return (
    <div className="card relative overflow-hidden p-4">
      <i className="absolute -right-2.5 -top-3 h-[54px] w-[54px] rounded-full" style={{ background: bg }} />
      <label className="text-[12px] font-semibold text-[#748198]">{label}</label>
      <strong className="my-2 block font-display text-[27px] font-extrabold">{value}</strong>
      <small className="text-[11px] font-bold" style={{ color: col }}>{detail}</small>
      <span className="absolute bottom-3.5 right-3.5 text-[19px]">{icon}</span>
    </div>
  );
}

export function Stats({ children }) {
  return <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">{children}</div>;
}