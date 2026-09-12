import { statusColor } from "../lib/constants";

export default function IssueTable({ issues, controls, open }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[12px]">
        <thead>
          <tr className="bg-[#fafbfe] text-left text-[10px] uppercase tracking-wide text-[#8290a6]">
            <th className="p-3.5">Priority</th>
            <th className="p-3.5">Issue</th>
            <th className="p-3.5">Status</th>
            <th className="p-3.5">Department</th>
            {controls && <th className="p-3.5">Action</th>}
          </tr>
        </thead>
        <tbody>
          {issues.map((i) => (
            <tr key={i._id} className="border-t border-[#edf0f5]">
              <td className="p-3.5">
                <b className={`grid h-[34px] w-[34px] place-items-center rounded-[9px] font-display ${i.priorityScore >= 80 ? "bg-[#fff0ef] text-[#d95357]" : "bg-[#edf0ff] text-[#5164d5]"}`}>
                  {i.priorityScore}
                </b>
              </td>
              <td className="p-3.5">
                <b>{i.title}</b>
                <small className="mt-1 block text-[11px] text-[#8995a8]">
                  {i.category} · {i.duplicateCount || 0} duplicate reports · {i.ward}
                </small>
              </td>
              <td className="p-3.5"><span className={`badge ${statusColor(i.status)}`}>{i.status}</span></td>
              <td className="p-3.5">{i.department}</td>
              {controls && (
                <td className="p-3.5"><button onClick={() => open(i)} className="ghost">View</button></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!issues.length && <p className="p-7 text-center text-[#8490a3]">No issues found.</p>}
    </div>
  );
}