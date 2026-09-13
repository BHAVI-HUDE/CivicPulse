import { useState } from "react";
import Heading from "../components/Heading";
import CardTitle from "../components/CardTitle";
import { Stat, Stats } from "../components/Stat";
import { CATEGORIES } from "../lib/constants";
import FeedCard from "../components/FeedCard";
import FeedDetail from "../overlays/FeedDetail";

export default function Feed({ issues }) {
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = category ? issues.filter((i) => i.category === category) : issues;
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );

  const resolved = issues.filter((i) => ["Resolved", "Verified"].includes(i.status)).length;
  const active = issues.length - resolved;

  return (
    <>
      <Heading
        title="Community feed"
        sub="Every issue reported across the city — open, in progress, or resolved. Nothing hidden."
      />
      <Stats>
        <Stat label="Total reported" value={issues.length} detail="City-wide" icon="◫" />
        <Stat label="Currently active" value={active} detail="Being worked on" icon="◌" tone="amber" />
        <Stat label="Resolved" value={resolved} detail="Fixed so far" icon="✓" tone="green" />
        <Stat
          label="Resolution rate"
          value={issues.length ? `${Math.round((resolved / issues.length) * 100)}%` : "—"}
          detail="Of all reports"
          icon="◒"
        />
      </Stats>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <CardTitle title={`${sorted.length} report${sorted.length === 1 ? "" : "s"}`} />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-[9px] border border-[#dfe5ee] p-2 text-[12px]"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mx-auto mt-4 max-w-[600px]">
        {sorted.map((i) => <FeedCard key={i._id} issue={i} open={setSelected} />)}
        {!sorted.length && <p className="py-10 text-center text-[13px] text-[#8490a3]">No reports match this filter.</p>}
      </div>

      {selected && <FeedDetail issue={selected} close={() => setSelected(null)} />}
    </>
  );
}