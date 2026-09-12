import { useState } from "react";
import Section from "../components/Section";
import Progress from "../components/Progress";
import Metric from "../components/Metric";
import Backdrop from "../components/Backdrop";
import { DEPARTMENTS, STATUS_STEPS, canManageIssues, isMunicipalAdmin, issueRef } from "../lib/constants";

export default function Drawer({ issue, currentUser, close, save, tell }) {
  const [department, setDepartment] = useState(issue.department);
  const [status, setStatus] = useState(issue.status);
  const [subDepartment, setSubDepartment] = useState(issue.subDepartment || "");
  const canManage = canManageIssues(currentUser?.role);
  const canReassignDepartment = isMunicipalAdmin(currentUser?.role);

  return (
    <>
      <Backdrop onClick={close} />
      <aside className="fixed right-0 top-[68px] z-50 h-[calc(100vh-68px)] w-full max-w-[430px] overflow-y-auto bg-white p-5 shadow-[-10px_0_40px_rgba(38,54,90,.13)]">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 font-display text-[19px] font-extrabold">{issue.title}</h2>
            <p className="my-1 text-[12px] text-[#7c899e]">
              {issueRef(issue)} · Reported {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "today"}
            </p>
          </div>
          <button onClick={close} className="h-7 w-7 shrink-0 rounded-[7px] bg-[#f1f3f8]">✕</button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-[12px] border border-[#ffe1d8] bg-gradient-to-br from-[#fff2ee] to-[#fff9f2] p-4">
          <div>
            <small className="text-[10px] font-bold text-[#98736f]">AI PRIORITY SCORE</small><br />
            <b className="font-display text-[25px] text-[#d54d50]">{issue.priorityScore} / 100</b>
          </div>
          <span className="badge bg-[#ffeaec] text-[#cc3d47]">{issue.priorityScore >= 85 ? "Critical" : "High"}</span>
        </div>

        {issue.images?.length > 0 && (
          <Section title="Reported photos">
            <div className="flex gap-2 overflow-x-auto">
              {issue.images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer">
                  <img src={src} alt={`Issue photo ${i + 1}`} className="h-20 w-20 shrink-0 rounded-[10px] border border-[#edf0f5] object-cover" />
                </a>
              ))}
            </div>
          </Section>
        )}

        <Section title="Resolution workflow">
          <Progress issue={issue} />
          {issue.slaDeadline && (
            <p className="text-[11px] text-[#8290a6]">
              SLA deadline: {new Date(issue.slaDeadline).toLocaleString()}
              {issue.escalationLevel > 0 && ` · Escalated ${issue.escalationLevel}×`}
            </p>
          )}
        </Section>

        <Section title="AI analysis">
          <div className="grid grid-cols-3 gap-2">
            <Metric title="CATEGORY" value={issue.category} />
            <Metric title="SEVERITY" value={`${issue.severity ?? "—"} / 10`} />
            <Metric title="CONFIDENCE" value={issue.aiConfidence != null ? `${Math.round(issue.aiConfidence * 100)}%` : "—"} />
            <div className="col-span-3 rounded-[10px] border border-[#edf0f5] bg-[#f8f9fd] p-3">
              <label className="text-[10px] font-bold text-[#8591a5]">DUPLICATE DETECTION</label>
              <b className="mt-1 block font-display text-[14px]">{issue.duplicateCount || 0} nearby reports matched</b>
            </div>
          </div>
        </Section>

        {issue.aiRationale && (
          <Section title="Why this is prioritized">
            <div className="rounded-[8px] bg-[#f8f9fc] p-3 text-[12px] leading-relaxed text-[#526078]">{issue.aiRationale}</div>
          </Section>
        )}

        <Section title="Assign & update">
          {!canManage ? (
            <p className="text-[12px] text-[#8290a6]">Your role doesn't have permission to update issues.</p>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={department}
                  disabled={!canReassignDepartment}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-[9px] border border-[#dfe5ee] p-2 text-[12px] disabled:bg-[#f5f7fb] disabled:text-[#9aa4bb]"
                >
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-[9px] border border-[#dfe5ee] p-2 text-[12px]">
                  {STATUS_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <input
                value={subDepartment}
                onChange={(e) => setSubDepartment(e.target.value)}
                placeholder="Sub-department (optional)"
                className="mt-2 w-full rounded-[9px] border border-[#dfe5ee] p-2 text-[12px]"
              />
              {!canReassignDepartment && (
                <p className="mt-1 text-[10px] text-[#8290a6]">Only a municipal admin can move an issue to a different department.</p>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => save({ department, status, subDepartment: subDepartment || null })} className="primary px-2 py-2 text-[11px]">Save assignment</button>
                <button onClick={() => tell("Field crew notified")} className="ghost px-2 py-2 text-[11px]">Notify field crew</button>
              </div>
            </>
          )}
        </Section>
      </aside>
    </>
  );
}