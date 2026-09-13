import { useEffect, useMemo, useState } from "react";
import { api, loadSession, saveSession, clearSession } from "./lib/api";
import { isAuthorityRole } from "./lib/constants";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import Tracking from "./pages/Tracking";
import Command from "./pages/Command";
import Queue from "./pages/Queue";
import Insights from "./pages/Insights";
import Drawer from "./overlays/Drawer";
import Analysis from "./overlays/Analysis";
import Notifications from "./overlays/Notifications";
import Toast from "./components/Toast";
import Approvals from "./pages/Approvals";
import Feed from "./pages/Feed";

const blankForm = { title: "", description: "", category: "", ward: "Ward 14", nearSchool: false };

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(() => (isAuthorityRole(loadSession()?.user?.role) ? "command" : "dashboard"));
  const [form, setForm] = useState(blankForm);
  const [images, setImages] = useState([]);
  const [toast, setToast] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [analysisIssue, setAnalysisIssue] = useState(null);
  const [notifications, setNotifications] = useState(false);

  const tell = (m) => {
    setToast(m);
    clearTimeout(window.cpToast);
    window.cpToast = setTimeout(() => setToast(""), 3000);
  };

  // Re-hydrate from the server on load so a stale role/verification status
  // from an old token can't drive the UI.
  useEffect(() => {
    if (!session?.token) return;
    api.me(session.token)
      .then((freshUser) => {
        const next = { token: session.token, user: freshUser };
        saveSession(next);
        setSession(next);
      })
      .catch(() => { clearSession(); setSession(null); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.listIssues().then(setIssues).catch(() =>
      tell("Live data is unavailable — reports cannot be saved until the API reconnects."),
    );
  }, []);

  const myIssues = useMemo(() => {
    if (!session?.user?.id) return issues;
    return issues.filter((i) => String(i.reporterId) === String(session.user.id));
  }, [issues, session]);

  const stats = useMemo(() => {
    const source = isAuthorityRole(session?.user?.role) ? issues : myIssues;
    return {
      total: source.length,
      active: source.filter((x) => x.status === "In progress").length,
      resolved: source.filter((x) => ["Resolved", "Verified"].includes(x.status)).length,
      critical: issues.filter((x) => x.priorityScore >= 80 && !["Resolved", "Verified"].includes(x.status)).length,
      overdue: issues.filter((x) => x.slaDeadline && new Date(x.slaDeadline) < new Date() && !["Resolved", "Verified"].includes(x.status)).length,
      needsVerification: myIssues.filter((x) => x.status === "Resolved" && x.verification === "Awaiting").length,
    };
  }, [issues, myIssues, session]);

  const go = (p) => { setPage(p); scrollTo({ top: 0, behavior: "smooth" }); };

  const addImages = async (e) => {
    const room = 3 - images.length;
    const files = Array.from(e.target.files || []).slice(0, Math.max(room, 0));
    e.target.value = "";
    if (!files.length) return;

    const pending = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), status: "uploading" }));
    setImages((prev) => [...prev, ...pending]);

    try {
      const body = await api.uploadImages(session.token, files);
      setImages((prev) => prev.map((img) => {
        const i = pending.findIndex((p) => p.url === img.url);
        return i === -1 ? img : { name: img.name, url: body.images[i], status: "done" };
      }));
    } catch (error) {
      setImages((prev) => prev.filter((img) => !pending.includes(img)));
      tell(error.message || "Could not upload photo(s). Please try again.");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!Number.isFinite(form.location?.latitude) || !Number.isFinite(form.location?.longitude)) {
      return tell("Pin the issue location before submitting.");
    }
    if (images.some((x) => x.status === "uploading")) return tell("Please wait for photos to finish uploading.");

    const payload = { ...form, images: images.filter((x) => x.status === "done").map((x) => x.url) };
    try {
      const created = await api.createIssue(session.token, payload);
      setIssues((x) => [created, ...x]);
      setForm(blankForm);
      setImages([]);
      setAnalysisIssue(created);
    } catch (error) {
      tell(error.message || "The report was not saved. Check the API and MongoDB connection.");
    }
  };

  const update = async (issue, changes) => {
    setIssues((all) => all.map((x) => (x._id === issue._id ? { ...x, ...changes } : x)));
    try {
      const updated = await api.updateIssue(session.token, issue._id, changes);
      setIssues((all) => all.map((x) => (x._id === issue._id ? updated : x)));
    } catch (error) {
      tell(error.message || "Could not save that change.");
    }
  };

  const verify = async (issue, confirmed) => {
    try {
      const updated = await api.verifyIssue(session.token, issue._id, confirmed);
      setIssues((all) => all.map((x) => (x._id === issue._id ? updated : x)));
      tell(confirmed ? "Thank you — the issue is now verified!" : "Thanks — the issue has been reopened for the team.");
    } catch (error) {
      tell(error.message || "Could not record your verification.");
    }
  };

  const handleLogin = (nextSession) => {
    setSession(nextSession);
    setPage(isAuthorityRole(nextSession.user.role) ? "command" : "dashboard");
  };

  const logout = () => { clearSession(); setSession(null); };

  if (!session) return <Auth onLogin={handleLogin} />;

  const authority = isAuthorityRole(session.user.role);
  const dashboardProps = { user: session.user, issues: myIssues, stats, report: () => go("report"), tracking: () => go("tracking") };
  const commandProps = { issues, stats, queue: () => go("queue"), insights: () => go("insights"), open: setDrawer };

  const view = {
    dashboard: <Dashboard {...dashboardProps} />,
    report: <Report form={form} setForm={setForm} submit={submit} images={images} setImages={setImages} addImages={addImages} />,
    tracking: <Tracking issues={myIssues} report={() => go("report")} verify={verify} />,
    command: <Command {...commandProps} />,
    queue: <Queue issues={issues} open={setDrawer} />,
    insights: <Insights issues={issues} tell={tell} />,
    approvals: <Approvals currentUser={session.user} token={session.token} tell={tell} />,
    feed: <Feed issues={issues} />,
    // Fallback guards against an unreachable page id ever rendering a
    // blank main area (this used to happen for authority users clicking
    // the citizen-only "Create demo report" shortcut).
  }[page] || (authority ? <Command {...commandProps} /> : <Dashboard {...dashboardProps} />);
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header user={session.user} bell={() => setNotifications(true)} home={() => go(authority ? "command" : "dashboard")} logout={logout} />
      <div className="grid min-h-[calc(100vh-68px)] md:grid-cols-[226px_1fr]">
        <Sidebar user={session.user} page={page} go={go} />
        <main className="mx-auto w-full max-w-[1550px] px-[4.5%] py-7">{view}</main>
      </div>
      {drawer && (
        <Drawer
          issue={drawer}
          currentUser={session.user}
          close={() => setDrawer(null)}
          save={(changes) => { update(drawer, changes); setDrawer(null); tell("Assignment saved and team notified"); }}
          tell={tell}
        />
      )}
      {analysisIssue && <Analysis issue={analysisIssue} close={() => setAnalysisIssue(null)} go={go} />}
      {notifications && <Notifications close={() => setNotifications(false)} />}
      <Toast message={toast} />
    </div>
  );
}