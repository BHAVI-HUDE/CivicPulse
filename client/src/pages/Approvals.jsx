import { useEffect, useState } from "react";
import Heading from "../components/Heading";
import CardTitle from "../components/CardTitle";
import { api } from "../lib/api";
import { ROLE_RANK } from "../lib/constants";

// Only pending accounts the logged-in user actually outranks are
// approvable — mirrors the backend's own rule in the /approve route
// (ROLE_RANK[approver.role] > ROLE_RANK[target.role]). Showing
// buttons the API would just 403 on isn't useful.
export default function Approvals({ currentUser, token, tell }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.listPending(token)
      .then(setPending)
      .catch((err) => tell(err.message || "Could not load pending accounts."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const canApprove = (target) => ROLE_RANK[currentUser.role] > ROLE_RANK[target.role];

  const approve = async (target) => {
    try {
      await api.approveUser(token, target._id || target.id, currentUser.id);
      setPending((prev) => prev.filter((u) => (u._id || u.id) !== (target._id || target.id)));
      tell(`${target.name} approved`);
    } catch (err) {
      tell(err.message || "Could not approve that account.");
    }
  };

  const reject = async (target) => {
    try {
      await api.rejectUser(token, target._id || target.id);
      setPending((prev) => prev.filter((u) => (u._id || u.id) !== (target._id || target.id)));
      tell(`${target.name} rejected`);
    } catch (err) {
      tell(err.message || "Could not reject that account.");
    }
  };

  return (
    <>
      <Heading title="Pending approvals" sub="Authority accounts waiting for verification before they can log in." />
      <div className="card">
        <CardTitle title={`${pending.length} awaiting review`} />
        <div className="px-5 pb-5">
          {loading && <p className="py-6 text-center text-[13px] text-[#8490a3]">Loading…</p>}
          {!loading && !pending.length && (
            <p className="py-6 text-center text-[13px] text-[#8490a3]">No accounts waiting for approval.</p>
          )}
          {pending.map((u) => {
            const id = u._id || u.id;
            const approvable = canApprove(u);
            return (
              <div key={id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[#edf0f5] py-3.5 last:border-0">
                <div className="min-w-0">
                  <b className="block truncate text-[13px]">{u.name}</b>
                  <small className="mt-0.5 block truncate text-[11px] text-[#8290a6]">
                    {u.email} · {u.role} {u.department ? `· ${u.department}` : ""} {u.ward ? `· ${u.ward}` : ""}
                  </small>
                  {!approvable && (
                    <small className="mt-0.5 block text-[10px] text-[#c98a2e]">
                      Outranks or matches your role — only a higher authority can decide this one.
                    </small>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(u)}
                    disabled={!approvable}
                    className="rounded-[8px] bg-[#e3f7f0] px-3 py-2 text-[11px] font-extrabold text-[#12806c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(u)}
                    disabled={!approvable}
                    className="rounded-[8px] bg-[#ffebed] px-3 py-2 text-[11px] font-extrabold text-[#ce4651] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}