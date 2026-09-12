import { initials, isAuthorityRole } from "../lib/constants";

export default function Header({ user, bell, home, logout }) {
  const authority = isAuthorityRole(user?.role);
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-[#e7ebf2] bg-white px-[4.8%]">
      <button onClick={home} className="flex items-center gap-2.5 font-display text-[21px] font-extrabold tracking-tight">
        <span className="grid h-[30px] w-[30px] place-items-center rounded-[10px] bg-gradient-to-br from-brand to-[#7651dc] text-[17px] text-white">✦</span>
        CivicPulse
      </button>
      <div className="mx-auto hidden text-[11px] font-bold text-[#8994a8] lg:block">
        <b className="text-brand">Report</b> → Analyze → Prioritize → Assign → Resolve → Verify
      </div>
      <span className="ml-auto hidden rounded-full bg-[#edf0ff] px-3 py-1 text-[11px] font-bold text-brand sm:block">
        {authority ? "Authority portal" : "Citizen portal"}
      </span>
      <button onClick={bell} className="relative rounded-[10px] bg-[#f3f5fa] p-2">
        🔔<i className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full border border-white bg-[#e14c58]" />
      </button>
      <button title="Sign out" onClick={logout} className="h-[33px] w-[33px] shrink-0 rounded-full bg-[#e3e8ff] text-[12px] font-extrabold text-brand">
        {initials(user?.name)}
      </button>
    </header>
  );
}