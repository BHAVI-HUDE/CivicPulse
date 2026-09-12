export default function Section({ title, children }) {
  return (
    <div className="border-b border-[#ebeff4] py-4">
      <h3 className="mb-2 font-display text-[12px] font-extrabold uppercase tracking-wide text-[#728098]">{title}</h3>
      {children}
    </div>
  );
}