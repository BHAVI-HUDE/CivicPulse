export default function Notifications({ close }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17223d88] p-4" onClick={close}>
      <div className="relative w-full max-w-[440px] rounded-[18px] bg-white p-6 shadow-[0_20px_70px_#101a32]" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-4 top-4 h-7 w-7 rounded-[7px] bg-[#f1f3f8]">✕</button>
        <h2 className="m-0 font-display text-[21px] font-extrabold">Notifications</h2>
        <div className="mt-3">
          {[
            ["✓", "Streetlight report resolved", "Your verification will close the loop."],
            ["🕳️", "Work started on Maple School pothole", "Road Maintenance · 15 minutes ago"],
            ["✦", "Your report was prioritized", "Priority score: 94 / 100"],
          ].map(([i, t, s]) => (
            <div className="grid grid-cols-[37px_1fr] gap-2.5 border-b border-[#edf0f5] py-3.5 last:border-0" key={t}>
              <div className="grid h-[35px] w-[35px] place-items-center rounded-[10px] bg-[#e4f6f1]">{i}</div>
              <div>
                <b className="text-[13px]">{t}</b>
                <small className="mt-0.5 block text-[11px] text-[#8290a6]">{s}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}