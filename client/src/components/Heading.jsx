export default function Heading({ title, sub, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="m-0 font-display text-[25px] font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-[#66748e]">{sub}</p>
      </div>
      {action}
    </div>
  );
}