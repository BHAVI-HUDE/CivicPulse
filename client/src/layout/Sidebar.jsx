import { isAuthorityRole } from "../lib/constants";

export default function Sidebar({ user, page, go }) {
  const authority = isAuthorityRole(user?.role);
  const items = authority
    ? [["command", "⌁", "Command center"], ["queue", "☷", "Priority queue"], ["insights", "◒", "City insights"],  ["approvals", "🛡️", "Approvals"],]
    : [["dashboard", "▦", "Dashboard"], ["report", "＋", "Report an issue"], ["tracking", "◌", "My reports"], ["feed", "🌐", "Community feed"]];

  return (
    <aside className="hidden bg-navy px-3.5 py-5 text-[#b9c1d6] md:block">
      <div className="mb-2 ml-2.5 mt-3 text-[10px] uppercase tracking-[1px] text-[#68748e]">Workspace</div>
      {items.map(([id, i, name]) => (
        <button key={id} onClick={() => go(id)} className={`nav-item ${page === id ? "active" : ""}`}>
          <span className="w-5 text-center text-[17px]">{i}</span>{name}
        </button>
      ))}
      <div className="mb-2 ml-2.5 mt-5 text-[10px] uppercase tracking-[1px] text-[#68748e]">Support</div>
      <button className="nav-item"><span className="w-5 text-center text-[17px]">?</span>Help center</button>

      {/* Only relevant to the citizen flow — was previously shown to
          authority users too and linked to a "report" page id that
          doesn't exist in their nav, which blanked the main area. */}
      {!authority && (
        <div className="mx-1 mt-6 rounded-[14px] border border-[#334773] bg-gradient-to-br from-[#27355e] to-[#182644] p-3.5">
          <b className="text-[12px] text-white">Demo mode is on</b>
          <p className="mt-2 text-[11px] leading-relaxed text-[#afbeda]">
            Explore a complete civic issue lifecycle with preloaded city data.
          </p>
          <button onClick={() => go("report")} className="mt-2 w-full rounded-[7px] bg-[#f0f3ff] p-2 text-[11px] font-bold text-[#344fc7]">
            Create demo report
          </button>
        </div>
      )}
    </aside>
  );
}