export default function Metric({ title, value }) {
  return (
    <div className="rounded-[10px] border border-[#edf0f5] bg-[#f8f9fd] p-2.5">
      <label className="block text-[9px] font-bold text-[#8591a5]">{title}</label>
      <b className="mt-1 block break-words font-display text-[12px]">{value}</b>
    </div>
  );
}