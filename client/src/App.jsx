import { useEffect, useMemo, useRef, useState } from "react";

const API = "/api/issues";
const AUTH_API = "/api/users";
const demo = [
  {
    _id: "pothole",
    title: "Deep pothole near Maple School",
    description:
      "Large pothole beside the school gate is dangerous for children and two-wheelers.",
    category: "Road",
    severity: 9,
    priorityScore: 94,
    duplicateCount: 7,
    department: "Road Maintenance",
    status: "In progress",
    ward: "Ward 14",
    verification: "Awaiting",
  },
  {
    _id: "water",
    title: "Major water leakage, Park Road",
    description: "Water is leaking continuously onto Park Road.",
    category: "Water",
    severity: 9,
    priorityScore: 89,
    duplicateCount: 5,
    department: "Water Department",
    status: "Assigned",
    ward: "Ward 12",
    verification: "Awaiting",
  },
  {
    _id: "garbage",
    title: "Garbage overflow at Central Market",
    description: "Overflowing waste bins are blocking the market lane.",
    category: "Sanitation",
    severity: 8,
    priorityScore: 83,
    duplicateCount: 9,
    department: "Sanitation",
    status: "Analyzed",
    ward: "Ward 14",
    verification: "Awaiting",
  },
  {
    _id: "streetlight",
    title: "Streetlight not working",
    description: "Streetlight has been off for three nights.",
    category: "Streetlight",
    severity: 5,
    priorityScore: 56,
    duplicateCount: 1,
    department: "Electrical Services",
    status: "Resolved",
    ward: "Ward 14",
    verification: "Awaiting",
  },
];
const blank = {
  title: "",
  description: "",
  category: "",
  ward: "Ward 14",
  nearSchool: false,
};
let displayedIssues = demo;
const icon = {
  Road: "🕳️",
  Water: "💧",
  Sanitation: "🗑️",
  Streetlight: "💡",
  Traffic: "🚦",
};
const statusColor = (s) =>
  ({
    "In progress": "bg-[#e9f0ff] text-[#3d63cb]",
    Resolved: "bg-[#e2f7f1] text-[#15816e]",
    Verified: "bg-[#e2f7f1] text-[#15816e]",
    Assigned: "bg-[#fff3db] text-[#b37410]",
    Analyzed: "bg-[#ffeaec] text-[#cc3d47]",
    Reported: "bg-[#ffeaec] text-[#cc3d47]",
  })[s] || "bg-slate-100 text-slate-600";
const sevColor = (n) =>
  n >= 85 ? "text-[#d84b52]" : n >= 70 ? "text-[#de971c]" : "text-[#139b83]";

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("civicpulse-session"));
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(session?.role || "citizen"),
    [page, setPage] = useState(
      session?.role === "authority" ? "command" : "dashboard",
    ),
    [user, setUser] = useState(session || null),
    [issues, setIssues] = useState(demo),
    [form, setForm] = useState(blank),
    [toast, setToast] = useState(""),
    [drawer, setDrawer] = useState(null),
    [analysis, setAnalysis] = useState(false),
    [notifications, setNotifications] = useState(false),
    [images, setImages] = useState([]);
  displayedIssues = issues;
  const tell = (m) => {
    setToast(m);
    clearTimeout(window.cpToast);
    window.cpToast = setTimeout(() => setToast(""), 3000);
  };
  useEffect(() => {
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setIssues)
      .catch(() =>
        tell(
          "Live data is unavailable — reports cannot be saved until the API reconnects.",
        ),
      );
  }, []);
  const stats = useMemo(
    () => ({
      total: issues.length || 12,
      active: issues.filter((x) => x.status === "In progress").length || 4,
      resolved:
        issues.filter((x) => ["Resolved", "Verified"].includes(x.status))
          .length || 6,
      critical:
        issues.filter(
          (x) =>
            x.priorityScore >= 80 &&
            !["Resolved", "Verified"].includes(x.status),
        ).length || 24,
    }),
    [issues],
  );
  const go = (p) => {
    setPage(p);
    scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (e) => {
    e.preventDefault();
    if (
      !Number.isFinite(form.location?.latitude) ||
      !Number.isFinite(form.location?.longitude)
    )
      return tell("Pin the issue location before submitting.");
    if (images.some((x) => x.status === "uploading"))
      return tell("Please wait for photos to finish uploading.");
    const payload = {
      ...form,
      images: images.filter((x) => x.status === "done").map((x) => x.url),
    };
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await r.json();
      if (!r.ok) throw Error(body.message || "Could not save the report.");
      setIssues((x) => [body, ...x]);
      setForm(blank);
      setImages([]);
      setAnalysis(true);
    } catch (error) {
      tell(
        error.message ||
          "The report was not saved. Check the API and MongoDB connection.",
      );
    }
  };
  const update = async (i, changes) => {
    setIssues((all) =>
      all.map((x) => (x._id === i._id ? { ...x, ...changes } : x)),
    );
    try {
      await fetch(`${API}/${i._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
    } catch {}
  };
  const login = (data) => {
    localStorage.setItem("civicpulse-session", JSON.stringify(data));
    setSession(data);
    setRole(data.role);
    setUser(data.user);
    setPage(data.role === "authority" ? "command" : "dashboard");
  };

  if (!session) return <Auth onLogin={login} />;
  const view = {
    dashboard: (
      <Dashboard
        user={user}
        issues={issues}
        stats={stats}
        report={() => go("report")}
        tracking={() => go("tracking")}
      />
    ),
    report: (
      <Report
        form={form}
        setForm={setForm}
        submit={submit}
        images={images}
        setImages={setImages}
        tell={tell}
      />
    ),
    tracking: (
      <Tracking
        issues={issues}
        report={() => go("report")}
        verify={(i, yes) => {
          update(i, {
            status: yes ? "Verified" : "In progress",
            verification: yes ? "Confirmed" : "Reopened",
          });
          tell(
            yes
              ? "Thank you — the issue is now verified!"
              : "Thanks — the issue has been reopened for the team.",
          );
        }}
      />
    ),
    command: (
      <Command
        issues={issues}
        stats={stats}
        queue={() => go("queue")}
        insights={() => go("insights")}
        open={setDrawer}
      />
    ),
    queue: <Queue issues={issues} open={setDrawer} />,
    insights: <Insights tell={tell} />,
  }[page];
  return (
    <div className="min-h-screen">
      <Header
        role={role}
        bell={() => setNotifications(true)}
        home={() => go(role === "authority" ? "command" : "dashboard")}
        logout={() => {
          localStorage.removeItem("civicpulse-session");
          setSession(null);
        }}
      />
      <div className="grid min-h-[calc(100vh-68px)] md:grid-cols-[226px_1fr]">
        <Sidebar role={role} page={page} go={go} />
        <main className="mx-auto w-full max-w-[1550px] px-[4.5%] py-7">
          {view}
        </main>
      </div>
      {drawer && (
        <Drawer
          issue={drawer}
          close={() => setDrawer(null)}
          save={(c) => {
            update(drawer, c);
            setDrawer(null);
            tell("Assignment saved and team notified");
          }}
          tell={tell}
        />
      )}{" "}
      {analysis && <Analysis close={() => setAnalysis(false)} go={go} />}{" "}
      {notifications && <Notifications close={() => setNotifications(false)} />}{" "}
      {toast && (
        <div className="fixed bottom-[22px] right-[22px] z-[70] rounded-[10px] bg-[#172542] px-4 py-3 text-[12px] font-bold text-white shadow-card">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
function Header({ role, bell, home, logout }) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-[#e7ebf2] bg-white px-[4.8%]">
      <button
        onClick={home}
        className="flex items-center gap-2.5 font-display text-[21px] font-extrabold tracking-tight"
      >
        <span className="grid h-[30px] w-[30px] place-items-center rounded-[10px] bg-gradient-to-br from-brand to-[#7651dc] text-[17px] text-white">
          ✦
        </span>
        CivicPulse
      </button>
      <div className="mx-auto hidden text-[11px] font-bold text-[#8994a8] lg:block">
        <b className="text-brand">Report</b> → Analyze → Prioritize → Assign →
        Resolve → Verify
      </div>
      <span className="ml-auto hidden rounded-full bg-[#edf0ff] px-3 py-1 text-[11px] font-bold text-brand sm:block">
        {role === "authority" ? "Authority portal" : "Citizen portal"}
      </span>
      <button
        onClick={bell}
        className="relative rounded-[10px] bg-[#f3f5fa] p-2"
      >
        🔔
        <i className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full border border-white bg-[#e14c58]" />
      </button>
      <button
        title="Sign out"
        onClick={logout}
        className="h-[33px] w-[33px] rounded-full bg-[#e3e8ff] text-[12px] font-extrabold text-brand"
      >
        AR
      </button>
    </header>
  );
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? `${AUTH_API}/login`
          : `${AUTH_API}/signup`;

      const payload =
        mode === "login"
          ? {
              email,
              password,
            }
          : {
              name,
              email,
              mobile,
              role,
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Something went wrong.");
      }

      onLogin(body.user);

    } catch (error) {
      setError(
        error.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_right,#e4e8ff,transparent_35%),#f5f7fb] p-5">
      <div className="grid w-full max-w-[900px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(32,47,82,.14)] md:grid-cols-[1.05fr_.95fr]">

        <section className="bg-gradient-to-br from-[#18264a] via-[#263d72] to-[#7651dc] p-9 text-white">

          <div className="flex items-center gap-2 font-display text-[22px] font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/20">
              ✦
            </span>
            CivicPulse
          </div>

          <h1 className="mt-20 font-display text-[34px] font-extrabold leading-tight">
            Better cities start with a clear signal.
          </h1>

          <p className="max-w-[330px] text-sm leading-relaxed text-[#dbe3ff]">
            Report civic issues, track progress, and help public teams focus on
            what matters most.
          </p>

          <div className="mt-10 rounded-xl border border-white/15 bg-white/10 p-4 text-xs">
            <b>How CivicPulse works</b>

            <p className="mb-1 mt-2">
              Report an issue → AI analyzes it → City team handles it
            </p>

            <p className="m-0">
              Track progress → Verify resolution
            </p>
          </div>

        </section>

        <section className="p-8 sm:p-10">

          <div className="mb-7 flex gap-5 border-b border-[#e7ebf2]">

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`pb-3 text-sm font-bold ${
                mode === "login"
                  ? "border-b-2 border-brand text-brand"
                  : "text-[#718097]"
              }`}
            >
              Log in
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`pb-3 text-sm font-bold ${
                mode === "signup"
                  ? "border-b-2 border-brand text-brand"
                  : "text-[#718097]"
              }`}
            >
              Create account
            </button>

          </div>

          <h2 className="font-display text-[24px] font-extrabold">
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h2>

          <p className="mb-6 text-sm text-[#718097]">
            {mode === "login"
              ? "Log in to continue to your CivicPulse portal."
              : "Start as a citizen or a city authority."}
          </p>

          <form onSubmit={submit}>

            {mode === "signup" && (
              <label className="field">
                Full name

                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
            )}

            {mode === "signup" && (
              <label className="field">
                Portal role

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="citizen">Citizen</option>
                  <option value="authority">City authority</option>
                </select>
              </label>
            )}

            {mode === "signup" && (
              <label className="field">
                Mobile No

                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter 10 digit phone number"
                />
              </label>
            )}

            <label className="field">
              Email

              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="field">
              Password

              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="mb-3 rounded-lg bg-[#ffeaec] p-2 text-xs text-[#cc3d47]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Log in to CivicPulse"
                  : "Create account"}
            </button>

          </form>

        </section>
      </div>
    </div>
  );
}
function Sidebar({ role, page, go }) {
  let items =
    role === "authority"
      ? [
          ["command", "⌁", "Command center"],
          ["queue", "☷", "Priority queue"],
          ["insights", "◒", "City insights"],
        ]
      : [
          ["dashboard", "▦", "Dashboard"],
          ["report", "＋", "Report an issue"],
          ["tracking", "◌", "My reports"],
        ];
  return (
    <aside className="hidden bg-navy px-3.5 py-5 text-[#b9c1d6] md:block">
      <div className="mb-2 ml-2.5 mt-3 text-[10px] uppercase tracking-[1px] text-[#68748e]">
        Workspace
      </div>
      {items.map(([id, i, name]) => (
        <button
          key={id}
          onClick={() => go(id)}
          className={`nav-item ${page === id ? "active" : ""}`}
        >
          <span className="w-5 text-center text-[17px]">{i}</span>
          {name}
        </button>
      ))}
      <div className="mb-2 ml-2.5 mt-5 text-[10px] uppercase tracking-[1px] text-[#68748e]">
        Support
      </div>
      <button className="nav-item">
        <span className="w-5 text-center text-[17px]">?</span>Help center
      </button>
      <div className="mx-1 mt-6 rounded-[14px] border border-[#334773] bg-gradient-to-br from-[#27355e] to-[#182644] p-3.5">
        <b className="text-[12px] text-white">Demo mode is on</b>
        <p className="mt-2 text-[11px] leading-relaxed text-[#afbeda]">
          Explore a complete civic issue lifecycle with preloaded city data.
        </p>
        <button
          onClick={() => go("report")}
          className="mt-2 w-full rounded-[7px] bg-[#f0f3ff] p-2 text-[11px] font-bold text-[#344fc7]"
        >
          Create demo report
        </button>
      </div>
    </aside>
  );
}
function Heading({ title, sub, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3">
      <div>
        <h1 className="m-0 font-display text-[25px] font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[#66748e]">{sub}</p>
      </div>
      {action}
    </div>
  );
}
function Stat({ label, value, detail, icon, tone = "blue" }) {
  let bg = {
      blue: "#e9eeff",
      amber: "#fff2dd",
      green: "#e2f7f1",
      red: "#ffeaec",
    }[tone],
    col = {
      blue: "#3855e8",
      amber: "#b77b1d",
      green: "#15816e",
      red: "#d34c55",
    }[tone];
  return (
    <div className="card relative overflow-hidden p-4">
      <i
        className="absolute -right-2.5 -top-3 h-[54px] w-[54px] rounded-full"
        style={{ background: bg }}
      />
      <label className="text-[12px] font-semibold text-[#748198]">
        {label}
      </label>
      <strong className="my-2 block font-display text-[27px] font-extrabold">
        {value}
      </strong>
      <small className="text-[11px] font-bold" style={{ color: col }}>
        {detail}
      </small>
      <span className="absolute bottom-3.5 right-3.5 text-[19px]">{icon}</span>
    </div>
  );
}
function Stats({ children }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">{children}</div>
  );
}
function CardTitle({ title, link, onClick }) {
  return (
    <div className="flex items-center justify-between px-5 pb-3 pt-[18px]">
      <h2 className="m-0 font-display text-[15px] font-extrabold tracking-tight">
        {title}
      </h2>
      {link && (
        <button onClick={onClick} className="text-[12px] font-bold text-brand">
          {link}
        </button>
      )}
    </div>
  );
}
function Map({
  className = "",
  onLocation,
  initialLocation,
  issues = displayedIssues,
  onLocationStatus,
}) {
  const target = useRef(null),
    map = useRef(null),
    marker = useRef(null),
    issueMarkers = useRef([]),
    onLocationRef = useRef(onLocation),
    statusRef = useRef(onLocationStatus);
  const valid = (location) =>
    Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);
  useEffect(() => {
    onLocationRef.current = onLocation;
    statusRef.current = onLocationStatus;
  }, [onLocation, onLocationStatus]);
  const placeMarker = (location, recenter = false) => {
    if (!map.current || !valid(location)) return;
    const point = [location.latitude, location.longitude];
    if (!marker.current)
      marker.current = window.L.marker(point).addTo(map.current);
    else marker.current.setLatLng(point);
    if (recenter) map.current.setView(point, 16);
  };
  useEffect(() => {
    if (!target.current || !window.L || map.current) return;
    const leafletMap = window.L.map(target.current, {
      scrollWheelZoom: false,
    }).setView([23.0225, 72.5714], 13);
    map.current = leafletMap;
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(leafletMap);
    leafletMap.on("click", (event) => {
      const location = {
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      };
      placeMarker(location);
      onLocationRef.current?.(location);
      statusRef.current?.("Location pinned on the map.");
    });
    if (onLocation && navigator.geolocation) {
      statusRef.current?.("Finding your current location…");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          placeMarker(location, true);
          onLocationRef.current?.(location);
          statusRef.current?.(
            "Using your current location. You can still click the map to adjust it.",
          );
        },
        () =>
          statusRef.current?.(
            "Location access was unavailable. Click the map to pin the issue manually.",
          ),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    } else if (onLocation)
      statusRef.current?.("Click the map to pin the issue location.");
    return () => {
      leafletMap.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (valid(initialLocation)) placeMarker(initialLocation);
  }, [initialLocation?.latitude, initialLocation?.longitude]);
  useEffect(() => {
    if (!map.current || !window.L) return;
    issueMarkers.current.forEach((item) => item.remove());
    issueMarkers.current = issues
      .filter((issue) => valid(issue.location))
      .map((issue) => {
        const item = window.L.marker([
          issue.location.latitude,
          issue.location.longitude,
        ]).addTo(map.current);
        const popup = document.createElement("strong");
        popup.textContent = issue.title;
        item.bindPopup(popup);
        return item;
      });
  }, [issues]);
  return <div ref={target} className={`overflow-hidden ${className}`} />;
}
function ReportRow({ issue }) {
  return (
    <div className="grid grid-cols-[37px_1fr_auto] items-center gap-2.5 border-b border-[#edf0f5] py-3.5 last:border-0">
      <div className="grid h-[35px] w-[35px] place-items-center rounded-[10px] bg-[#fff1e8]">
        {icon[issue.category] || "◌"}
      </div>
      <div>
        <b className="text-[13px]">{issue.title}</b>
        <small className="mt-0.5 block text-[11px] text-[#8290a6]">
          CP-2026-10{issue.priorityScore} · {issue.duplicateCount} nearby
          reports
        </small>
      </div>
      <span className={`badge ${statusColor(issue.status)}`}>
        {issue.status}
      </span>
    </div>
  );
}
function Dashboard({ user={user}, issues, stats, report, tracking }) {
  return (
    <>
      <Heading
        title={<>Good morning, {user?.name || "user"}👋</>}
        sub="Here’s the pulse of your neighbourhood today."
        action={
          <button className="primary" onClick={report}>
            ＋ Report an issue
          </button>
        }
      />
      <Stats>
        <Stat
          label="My reports"
          value={stats.total}
          detail="+2 this month"
          icon="◫"
        />
        <Stat
          label="In progress"
          value={stats.active}
          detail="Being handled"
          icon="◌"
          tone="amber"
        />
        <Stat
          label="Resolved"
          value={stats.resolved}
          detail="50% resolution rate"
          icon="✓"
          tone="green"
        />
        <Stat
          label="Needs verification"
          value="1"
          detail="Action needed"
          icon="!"
          tone="red"
        />
      </Stats>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.38fr_.95fr]">
        <div className="card">
          <CardTitle
            title="Recent reports"
            link="View all →"
            onClick={tracking}
          />
          <div className="px-5 pb-2">
            {issues.slice(0, 3).map((i) => (
              <ReportRow key={i._id} issue={i} />
            ))}
          </div>
        </div>
        <div className="card">
          <CardTitle title="Quick actions" />
          <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
            {[
              ["＋", "New report", report],
              ["◌", "Track reports", tracking],
              ["?", "Help center", null],
            ].map(([i, t, c]) => (
              <button
                key={t}
                onClick={c}
                className="rounded-[10px] border border-[#e7ebf2] bg-[#fafbfe] px-1.5 py-3 text-[11px] font-bold text-[#526076]"
              >
                <span className="mb-1 block text-[18px]">{i}</span>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <CardTitle title="Your neighbourhood" />
          <Map className="h-[245px] rounded-b-[14px]" />
        </div>
        <div className="card">
          <CardTitle title="Recent activity" />
          <div className="px-5 pb-5">
            {[
              [
                "✦",
                "Report prioritized",
                "Deep pothole near Maple School · 15 minutes ago",
              ],
              ["◌", "Work started", "Road Maintenance deployed a crew"],
              ["✓", "Streetlight resolved", "Your verification is needed"],
            ].map(([i, t, s]) => (
              <div className="grid grid-cols-[28px_1fr] gap-2 py-2.5" key={t}>
                <span className="grid h-[21px] w-[21px] place-items-center rounded-full bg-[#e6ebff] text-[10px] text-brand">
                  {i}
                </span>
                <div>
                  <b className="text-[12px]">{t}</b>
                  <small className="mt-0.5 block text-[11px] text-[#8490a6]">
                    {s}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
// AFTER
function Report({ form, setForm, submit, images, setImages, tell }) {
  let change = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  // Photos upload to Cloudinary (via our API) as soon as they're
  // selected, rather than at submit time. Each entry tracks a
  // `status` of "uploading" | "done" | "error" so the form can show
  // progress and stop the citizen from submitting before uploads
  // finish (a local blob: URL is never something the authority
  // dashboard could actually load).
  let add = async (e) => {
    const room = 3 - images.length;
    const files = Array.from(e.target.files || []).slice(0, Math.max(room, 0));
    e.target.value = "";
    if (!files.length) return;

    const pending = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      status: "uploading",
    }));
    setImages((prev) => [...prev, ...pending]);

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    try {
      const r = await fetch(`${API}/upload`, { method: "POST", body: formData });
      const body = await r.json();
      if (!r.ok) throw new Error(body.message || "Photo upload failed.");
      setImages((prev) =>
        prev.map((img) => {
          const i = pending.findIndex((p) => p.url === img.url);
          return i === -1 ? img : { name: img.name, url: body.images[i], status: "done" };
        }),
      );
    } catch (error) {
      setImages((prev) => prev.filter((img) => !pending.includes(img)));
      tell(error.message || "Could not upload photo(s). Please try again.");
    }
  };
  return (
    <>
      <Heading
        title="Report a civic issue"
        sub="Describe what you see — we’ll turn it into action."
      />
      <form
        onSubmit={submit}
        className="grid gap-[18px] xl:grid-cols-[1fr_.86fr]"
      >
        <div className="card p-[22px]">
          <h2 className="m-0 font-display text-[17px] font-extrabold">
            Tell us what happened
          </h2>
          <p className="mb-5 mt-1 text-[12px] text-[#66748e]">
            CivicPulse uses your report to classify, prioritize and route the
            issue.
          </p>
          <label className="field">
            Issue title <em className="not-italic text-[#de4e54]">*</em>
            <input
              required
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g. Deep pothole near Maple School"
            />
          </label>
          <label className="field">
            Describe the issue <em className="not-italic text-[#de4e54]">*</em>
            <textarea
              required
              name="description"
              value={form.description}
              onChange={change}
              placeholder="What happened? Who is affected? Add useful details for the city team."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              Issue type
              <select name="category" value={form.category} onChange={change}>
                <option value="">Let AI classify it</option>
                {[
                  "Road",
                  "Water",
                  "Sanitation",
                  "Streetlight",
                  "Traffic",
                  "Other",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Add photos{" "}
            <span className="font-normal text-[#8995a9]">(up to 3)</span>
            <span className="mt-1.5 block cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-[#bfc9dc] bg-[#fafbfe] p-5 text-center text-[#718097]">
              <input
                className="hidden"
                type="file"
                accept="image/*"
                multiple
                onChange={add}
              />
              <b className="block text-[12px] text-[#4d5d76]">
                {images.length
                  ? `${images.length} of 3 images selected`
                  : "Upload up to 3 images"}
              </b>
              <small>JPG, PNG or HEIC · up to 10MB each</small>
            </span>
          </label>
          // AFTER
        {images.length > 0 && (
          <div className="mb-4 flex gap-2">
            {images.map((image, i) => (
              <div key={i} className="relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className={`h-16 w-16 rounded-lg object-cover ${image.status === "uploading" ? "opacity-50" : ""}`}
                />
                {image.status === "uploading" && (
                  <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/20 text-[9px] font-bold text-white">
                    Uploading…
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, x) => x !== i))}
                  className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#172542] text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
          <label className="flex items-center gap-2 text-[12px] font-bold">
            <input
              className="w-auto"
              type="checkbox"
              name="nearSchool"
              checked={form.nearSchool}
              onChange={change}
            />{" "}
            This is near a school or high-risk location
          </label>
          <div className="mt-5 flex items-center justify-between gap-4">
            <small className="max-w-[250px] text-[10px] text-[#7a879a]">
              Your report will be analyzed for category, urgency, duplicates and
              routing.
            </small>
            <button
              className="primary"
              disabled={images.some((x) => x.status === "uploading")}
            >
              {images.some((x) => x.status === "uploading")
                ? "Uploading photos…"
                : "Analyze & submit →"}
            </button>
          </div>
        </div>
        <div className="card p-[22px]">
          <h2 className="m-0 font-display text-[17px] font-extrabold">
            Pin the location
          </h2>
          <p className="mb-5 mt-1 text-[12px] text-[#66748e]">
            Click anywhere on the live map to place your issue marker.
          </p>
          <Map
            className="h-[250px] rounded-[11px]"
            onLocation={(location) => setForm({ ...form, location })}
          />
          <label className="field mt-4">
            Ward
            <input name="ward" value={form.ward} onChange={change} />
          </label>
          <div className="mt-6 rounded-[10px] bg-[#f4f6ff] p-3.5">
            <b className="text-[12px]">✦ What happens next?</b>
            <p className="mb-0 mt-1.5 text-[11px] leading-relaxed text-[#728099]">
              CivicPulse checks nearby reports, calculates urgency, and routes
              the issue to the right city team.
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
function Progress({ issue }) {
  let steps = [
      "Reported",
      "Analyzed",
      "Assigned",
      "In progress",
      "Resolved",
      "Verified",
    ],
    at = Math.max(0, steps.indexOf(issue.status));
  return (
    <div className="flex justify-between py-5">
      {steps.map((s, i) => (
        <div
          key={s}
          className="relative z-[1] flex w-full flex-col items-center text-center text-[9px] text-[#8c97a9]"
        >
          <i
            className={`mb-1.5 block h-[17px] w-[17px] rounded-full ${i < at ? "bg-[#0f9b86] ring-4 ring-[#e1f6f1]" : i === at ? "bg-brand ring-4 ring-[#e4e8ff]" : "bg-[#dfe5ef]"}`}
          />
          {s}
        </div>
      ))}
    </div>
  );
}
function IssueTable({ issues, controls, open }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
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
                <b
                  className={`grid h-[34px] w-[34px] place-items-center rounded-[9px] font-display ${i.priorityScore >= 80 ? "bg-[#fff0ef] text-[#d95357]" : "bg-[#edf0ff] text-[#5164d5]"}`}
                >
                  {i.priorityScore}
                </b>
              </td>
              <td className="p-3.5">
                <b>{i.title}</b>
                <small className="mt-1 block text-[11px] text-[#8995a8]">
                  {i.category} · {i.duplicateCount} duplicate reports · {i.ward}
                </small>
              </td>
              <td className="p-3.5">
                <span className={`badge ${statusColor(i.status)}`}>
                  {i.status}
                </span>
              </td>
              <td className="p-3.5">{i.department}</td>
              {controls && (
                <td className="p-3.5">
                  <button onClick={() => open(i)} className="ghost">
                    View
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!issues.length && (
        <p className="p-7 text-center text-[#8490a3]">No issues found.</p>
      )}
    </div>
  );
}
function Tracking({ issues, report, verify }) {
  let resolved = issues.find(
    (i) => i.status === "Resolved" && i.verification === "Awaiting",
  );
  let focus = issues[0] || demo[0];
  return (
    <>
      <Heading
        title="My reports"
        sub="Follow every issue from first report to verified resolution."
        action={
          <button className="primary" onClick={report}>
            ＋ Report an issue
          </button>
        }
      />
      <div className="card">
        <IssueTable issues={issues} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.38fr_.95fr]">
        <div className="card">
          <CardTitle title={`${focus.title} · Resolution progress`} />
          <div className="px-5 pb-5">
            <Progress issue={focus} />
            <div className="rounded-[8px] bg-[#f8f9fc] p-3 text-[12px] leading-relaxed text-[#526078]">
              {focus.department} has deployed a crew. Expected completion:{" "}
              <b>Today, 4:30 PM</b>.
            </div>
          </div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-[44px]">🙌</div>
          <h2 className="m-1 font-display text-[18px] font-extrabold">
            Was this fixed?
          </h2>
          <p className="mx-auto mb-4 max-w-[390px] text-[12px] text-[#718097]">
            Your Streetlight report was marked resolved. Please tell us whether
            the fix worked.
          </p>
          {resolved ? (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => verify(resolved, true)}
                className="rounded-[9px] bg-[#e3f7f0] px-4 py-2.5 text-[12px] font-extrabold text-[#12806c]"
              >
                👍 Yes, fixed
              </button>
              <button
                onClick={() => verify(resolved, false)}
                className="rounded-[9px] bg-[#ffebed] px-4 py-2.5 text-[12px] font-extrabold text-[#ce4651]"
              >
                👎 Not yet
              </button>
            </div>
          ) : (
            <small className="text-[#718097]">
              No reports are waiting for verification.
            </small>
          )}
        </div>
      </div>
    </>
  );
}
function Command({ issues, stats, queue, insights, open }) {
  let active = issues.filter(
    (i) => !["Resolved", "Verified"].includes(i.status),
  );
  return (
    <>
      <Heading
        title="City command center"
        sub="One view to move from incoming signal to verified public impact."
        action={
          <div className="flex gap-2">
            <button className="ghost">Today</button>
            <button className="ghost">Ward 14</button>
          </div>
        }
      />
      <Stats>
        <Stat
          label="Critical issues"
          value={stats.critical}
          detail="↑ 4 since yesterday"
          icon="🔥"
          tone="red"
        />
        <Stat
          label="Awaiting assignment"
          value={issues.filter((i) => i.status === "Analyzed").length || 37}
          detail="Needs attention"
          icon="◷"
          tone="amber"
        />
        <Stat
          label="In progress"
          value={stats.active || 68}
          detail="74% on target"
          icon="◌"
        />
        <Stat
          label="Verified this week"
          value="128"
          detail="↑ 18% vs last week"
          icon="✓"
          tone="green"
        />
      </Stats>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.38fr_.95fr]">
        <div className="card">
          <CardTitle
            title="Priority queue"
            link="Manage queue →"
            onClick={queue}
          />
          <div className="px-5 pb-4">
            {active.slice(0, 4).map((i) => (
              <button
                key={i._id}
                onClick={() => open(i)}
                className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-2 border-b border-[#edf0f5] py-3 text-left last:border-0"
              >
                <b className="grid h-[31px] w-[31px] place-items-center rounded-[9px] bg-[#fff0ef] font-display text-[13px] text-[#d95357]">
                  {i.priorityScore}
                </b>
                <span>
                  <b className="block text-[12px]">{i.title}</b>
                  <small className="mt-0.5 block text-[10px] text-[#8894a7]">
                    {i.department} · {i.duplicateCount} duplicate reports ·{" "}
                    {i.ward}
                  </small>
                </span>
                <span
                  className={`badge ${i.priorityScore >= 85 ? "bg-[#ffeaec] text-[#cc3d47]" : "bg-[#fff3db] text-[#b37410]"}`}
                >
                  {i.priorityScore >= 85 ? "Critical" : "High"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <CardTitle
            title="Live civic hotspots"
            link="Explore map →"
            onClick={insights}
          />
          <Map className="h-[245px] rounded-b-[14px]" />
        </div>
        <div className="card">
          <CardTitle title="Issue volume · last 7 days" />
          <Bars />
        </div>
        <div className="card">
          <CardTitle
            title="Resolution mix"
            link="Full analytics →"
            onClick={insights}
          />
          <Donut />
        </div>
      </div>
    </>
  );
}
function Bars() {
  let h = [42, 60, 48, 79, 67, 51, 74];
  return (
    <div className="flex h-[220px] items-end justify-around border-b border-[#dfe5ee] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_48px,#edf0f5_49px)] px-5 pb-6">
      {h.map((n, i) => (
        <div className="flex h-full items-end gap-1" key={n}>
          <i
            className="w-[13px] rounded-t-[5px] bg-[#6178eb]"
            style={{ height: `${n}%` }}
          />
          <i
            className="w-[13px] rounded-t-[5px] bg-[#cbd3ff]"
            style={{ height: `${Math.max(28, n - 17)}%` }}
          />
          <small className="absolute mb-[-20px] text-[10px] text-[#8794a9]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
          </small>
        </div>
      ))}
    </div>
  );
}
function Donut() {
  return (
    <div className="flex items-center gap-6 p-5">
      <div
        className="relative h-[132px] w-[132px] rounded-full"
        style={{
          background:
            "conic-gradient(#3855e8 0 42%,#0f9b86 42% 70%,#f08b35 70% 87%,#dfe4ef 87%)",
        }}
      >
        <div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center font-display text-[15px] font-extrabold">
          128
          <br />
          <small>Resolved</small>
        </div>
      </div>
      <div className="text-[11px] leading-8 text-[#67748a]">
        🔵 Roads <b>42%</b>
        <br />
        🟢 Water & drainage <b>28%</b>
        <br />
        🟠 Sanitation <b>17%</b>
        <br />⚪ Other <b>13%</b>
      </div>
    </div>
  );
}
function Queue({ issues, open }) {
  return (
    <>
      <Heading
        title="Prioritized issue queue"
        sub="AI-ranked for impact, urgency and community reach."
        action={
          <div className="flex gap-2">
            <button className="ghost">All issues</button>
            <button className="ghost">Critical</button>
          </div>
        }
      />
      <div className="card">
        <IssueTable
          issues={[...issues].sort((a, b) => b.priorityScore - a.priorityScore)}
          controls
          open={open}
        />
      </div>
    </>
  );
}
function Insights({ tell }) {
  return (
    <>
      <Heading
        title="City insights"
        sub="Turn reports into evidence for better public services."
        action={
          <button
            className="ghost"
            onClick={() => tell("Insight report exported")}
          >
            ⇩ Export report
          </button>
        }
      />
      <Stats>
        <Stat
          label="Average response time"
          value="3.8h"
          detail="↓ 22% this month"
          icon="◷"
        />
        <Stat
          label="Citizen verification"
          value="91%"
          detail="↑ 5% this month"
          icon="✓"
          tone="green"
        />
        <Stat
          label="Duplicate clustering"
          value="318"
          detail="Reports consolidated"
          icon="◌"
          tone="amber"
        />
        <Stat
          label="Top hotspot"
          value="Ward 14"
          detail="28 active issues"
          icon="🔥"
          tone="red"
        />
      </Stats>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.38fr_.95fr]">
        <div className="card">
          <CardTitle title="Ward 14 — civic hotspot map" />
          <Map className="h-[330px] rounded-b-[14px]" />
        </div>
        <div className="card">
          <CardTitle title="AI impact summary" />
          <div className="space-y-2.5 p-5 pt-1">
            {[
              [
                "✦ 21% faster triage",
                "AI routing avoided manual review on 184 reports this week.",
              ],
              [
                "◉ 318 duplicate reports clustered",
                "Teams acted on 96 unique real-world issues instead of fragmented reports.",
              ],
              [
                "↗ Highest-risk pattern detected",
                "Road safety issues near schools spike between 7–9 AM.",
              ],
            ].map(([t, s]) => (
              <div
                key={t}
                className="rounded-[8px] bg-[#f8f9fc] p-3 text-[12px] leading-relaxed text-[#526078]"
              >
                <b>{t}</b>
                <br />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
function Drawer({ issue, close, save, tell }) {
  const [department, setDepartment] = useState(issue.department),
    [status, setStatus] = useState(issue.status);
  return (
    <aside className="fixed right-0 top-[68px] z-40 h-[calc(100vh-68px)] w-full max-w-[430px] overflow-auto bg-white p-5 shadow-[-10px_0_40px_rgba(38,54,90,.13)]">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="m-0 font-display text-[19px] font-extrabold">
            {issue.title}
          </h2>
          <p className="my-1 text-[12px] text-[#7c899e]">
            CP-2026-10{issue.priorityScore} · Reported today
          </p>
        </div>
        <button onClick={close} className="h-7 w-7 rounded-[7px] bg-[#f1f3f8]">
          ✕
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-[12px] border border-[#ffe1d8] bg-gradient-to-br from-[#fff2ee] to-[#fff9f2] p-4">
        <div>
          <small className="text-[10px] font-bold text-[#98736f]">
            AI PRIORITY SCORE
          </small>
          <br />
          <b className="font-display text-[25px] text-[#d54d50]">
            {issue.priorityScore} / 100
          </b>
        </div>
        <span className="badge bg-[#ffeaec] text-[#cc3d47]">
          {issue.priorityScore >= 85 ? "Critical" : "High"}
        </span>
      </div>
      // AFTER
      {issue.images?.length > 0 && (
        <Section title="Reported photos">
          <div className="flex gap-2 overflow-x-auto">
            {issue.images.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer">
                <img
                  src={src}
                  alt={`Issue photo ${i + 1}`}
                  className="h-20 w-20 shrink-0 rounded-[10px] border border-[#edf0f5] object-cover"
                />
              </a>
            ))}
          </div>
        </Section>
      )}
      <Section title="Resolution workflow">
        <Progress issue={issue} />
      </Section>
      <Section title="AI analysis">
        <div className="grid grid-cols-3 gap-2">
          <Metric title="CATEGORY" value={issue.category} />
          <Metric title="SEVERITY" value={`${issue.severity || 8}.4 / 10`} />
          <Metric title="CONFIDENCE" value="96%" />
          <div className="col-span-3 rounded-[10px] border border-[#edf0f5] bg-[#f8f9fd] p-3">
            <label className="text-[10px] font-bold text-[#8591a5]">
              DUPLICATE DETECTION
            </label>
            <b className="mt-1 block font-display text-[14px]">
              {issue.duplicateCount} nearby reports matched
            </b>
          </div>
        </div>
      </Section>
      <Section title="Why this is prioritized">
        <div className="rounded-[8px] bg-[#f8f9fc] p-3 text-[12px] leading-relaxed text-[#526078]">
          High-risk location near a school zone, severe civic impact, and{" "}
          {issue.duplicateCount} independent citizen reports. Estimated 300+
          people affected daily.
        </div>
      </Section>
      <Section title="Assign & update">
        <div className="flex gap-2">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-[9px] border border-[#dfe5ee] p-2 text-[12px]"
          >
            <option>Road Maintenance</option>
            <option>Water Department</option>
            <option>Sanitation</option>
            <option>Electrical Services</option>
            <option>Traffic Control</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-[9px] border border-[#dfe5ee] p-2 text-[12px]"
          >
            <option>Analyzed</option>
            <option>Assigned</option>
            <option>In progress</option>
            <option>Resolved</option>
          </select>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => save({ department, status })}
            className="primary px-2 py-2 text-[11px]"
          >
            Save assignment
          </button>
          <button
            onClick={() => tell("Field crew notified")}
            className="ghost px-2 py-2 text-[11px]"
          >
            Notify field crew
          </button>
        </div>
      </Section>
    </aside>
  );
}
function Section({ title, children }) {
  return (
    <div className="border-b border-[#ebeff4] py-4">
      <h3 className="mb-2 font-display text-[12px] font-extrabold uppercase tracking-wide text-[#728098]">
        {title}
      </h3>
      {children}
    </div>
  );
}
function Metric({ title, value }) {
  return (
    <div className="rounded-[10px] border border-[#edf0f5] bg-[#f8f9fd] p-2.5">
      <label className="block text-[9px] font-bold text-[#8591a5]">
        {title}
      </label>
      <b className="mt-1 block font-display text-[12px]">{value}</b>
    </div>
  );
}
function Analysis({ close, go }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17223d88] p-4">
      <div className="relative w-full max-w-[600px] rounded-[18px] bg-white p-7 text-center shadow-[0_20px_70px_#101a32]">
        <button
          onClick={close}
          className="absolute right-4 top-4 h-7 w-7 rounded-[7px] bg-[#f1f3f8]"
        >
          ✕
        </button>
        <div className="mx-auto grid h-[65px] w-[65px] place-items-center rounded-[20px] bg-gradient-to-br from-[#546cec] to-[#8961e5] text-[30px] text-white shadow-[0_8px_25px_#c2c8ff]">
          ✦
        </div>
        <h2 className="mb-1 mt-3 font-display text-[21px] font-extrabold">
          AI analysis complete
        </h2>
        <p className="mb-5 text-[12px] text-[#718097]">
          Your report is now a structured, actionable civic issue.
        </p>
        <div className="grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
          <Metric title="DETECTED CATEGORY" value="Road / Pothole" />
          <Metric title="SEVERITY" value="9.2 / 10" />
          <Metric title="CONFIDENCE" value="96%" />
          <Metric title="PRIORITY SCORE" value="94 / 100 🔥" />
          <Metric title="DUPLICATES FOUND" value="7 nearby reports" />
          <Metric title="ROUTED TO" value="Road Maintenance" />
          <div className="col-span-2 rounded-[10px] border border-[#edf0f5] bg-[#f8f9fd] p-3 sm:col-span-3">
            <label className="text-[10px] font-bold text-[#8591a5]">
              AI REASONING
            </label>
            <b className="mt-1 block text-[12px] leading-relaxed">
              The description indicates a large road hazard beside a school
              entrance. Location sensitivity, high severity and matching nearby
              reports raise the priority.
            </b>
          </div>
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => {
              close();
              go("tracking");
            }}
            className="ghost"
          >
            View my report
          </button>
          <button
            onClick={() => {
              close();
              go("dashboard");
            }}
            className="primary"
          >
            Done ✓
          </button>
        </div>
      </div>
    </div>
  );
}
function Notifications({ close }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17223d88] p-4">
      <div className="relative w-full max-w-[440px] rounded-[18px] bg-white p-6 shadow-[0_20px_70px_#101a32]">
        <button
          onClick={close}
          className="absolute right-4 top-4 h-7 w-7 rounded-[7px] bg-[#f1f3f8]"
        >
          ✕
        </button>
        <h2 className="m-0 font-display text-[21px] font-extrabold">
          Notifications
        </h2>
        <div className="mt-3">
          {[
            [
              "✓",
              "Streetlight report resolved",
              "Your verification will close the loop.",
            ],
            [
              "🕳️",
              "Work started on Maple School pothole",
              "Road Maintenance · 15 minutes ago",
            ],
            ["✦", "Your report was prioritized", "Priority score: 94 / 100"],
          ].map(([i, t, s]) => (
            <div
              className="grid grid-cols-[37px_1fr] gap-2.5 border-b border-[#edf0f5] py-3.5 last:border-0"
              key={t}
            >
              <div className="grid h-[35px] w-[35px] place-items-center rounded-[10px] bg-[#e4f6f1]">
                {i}
              </div>
              <div>
                <b className="text-[13px]">{t}</b>
                <small className="mt-0.5 block text-[11px] text-[#8290a6]">
                  {s}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
