export default function CardTitle({ title, link, onClick }) {
  return (
    <div className="flex items-center justify-between px-5 pb-3 pt-[18px]">
      <h2 className="m-0 font-display text-[15px] font-extrabold tracking-tight">{title}</h2>
      {link && <button onClick={onClick} className="text-[12px] font-bold text-brand">{link}</button>}
    </div>
  );
}