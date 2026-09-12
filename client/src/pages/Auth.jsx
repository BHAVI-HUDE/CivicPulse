import { useState } from "react";
import { ROLES, DEPARTMENTS } from "../lib/constants";
import { api, saveSession } from "../lib/api";

const blankSignup = { name: "", email: "", mobile: "", password: "", role: "citizen", department: "", subDepartment: "", ward: "", zone: "" };

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [signup, setSignup] = useState(blankSignup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const role = ROLES.find((r) => r.value === signup.role);

  const switchMode = (next) => { setMode(next); setError(""); setInfo(""); };
  const changeSignup = (e) => setSignup((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submitLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const body = await api.login(email, password);
      const session = { token: body.token, user: body.user };
      saveSession(session);
      onLogin(session);
    } catch (err) {
      setError(err.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const payload = {
        name: signup.name,
        email: signup.email,
        mobile: signup.mobile,
        role: signup.role,
        password: signup.password,
        department: role?.requiresDepartment ? signup.department : undefined,
        subDepartment: role?.requiresDepartment ? signup.subDepartment || undefined : undefined,
        ward: signup.ward || undefined,
        zone: signup.zone || undefined,
      };
      const body = await api.signup(payload);
      // The server never returns a token from signup — citizens can log in
      // immediately, authority roles need approval first. Send them to the
      // login tab either way instead of faking a session.
      setInfo(body.message || "Account created. Please log in.");
      setEmail(signup.email);
      setPassword("");
      setSignup(blankSignup);
      setMode("login");
    } catch (err) {
      setError(err.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center overflow-x-hidden bg-[radial-gradient(circle_at_top_right,#e4e8ff,transparent_35%),#f5f7fb] p-5">
      <div className="grid w-full max-w-[900px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(32,47,82,.14)] md:grid-cols-[1.05fr_.95fr]">
        <section className="bg-gradient-to-br from-[#18264a] via-[#263d72] to-[#7651dc] p-9 text-white">
          <div className="flex items-center gap-2 font-display text-[22px] font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/20">✦</span>CivicPulse
          </div>
          <h1 className="mt-20 font-display text-[34px] font-extrabold leading-tight">Better cities start with a clear signal.</h1>
          <p className="max-w-[330px] text-sm leading-relaxed text-[#dbe3ff]">
            Report civic issues, track progress, and help public teams focus on what matters most.
          </p>
          <div className="mt-10 rounded-xl border border-white/15 bg-white/10 p-4 text-xs">
            <b>How CivicPulse works</b>
            <p className="mb-1 mt-2">Report an issue → AI analyzes it → City team handles it</p>
            <p className="m-0">Track progress → Verify resolution</p>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <div className="mb-7 flex gap-5 border-b border-[#e7ebf2]">
            <button type="button" onClick={() => switchMode("login")} className={`pb-3 text-sm font-bold ${mode === "login" ? "border-b-2 border-brand text-brand" : "text-[#718097]"}`}>Log in</button>
            <button type="button" onClick={() => switchMode("signup")} className={`pb-3 text-sm font-bold ${mode === "signup" ? "border-b-2 border-brand text-brand" : "text-[#718097]"}`}>Create account</button>
          </div>

          <h2 className="font-display text-[24px] font-extrabold">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="mb-6 text-sm text-[#718097]">
            {mode === "login" ? "Log in to continue to your CivicPulse portal." : "Citizens can start reporting immediately; authority roles need approval from a higher authority before they can log in."}
          </p>

          {info && <p className="mb-4 rounded-lg bg-[#e2f7f1] p-2 text-xs text-[#15816e]">{info}</p>}
          {error && <p className="mb-4 rounded-lg bg-[#ffeaec] p-2 text-xs text-[#cc3d47]">{error}</p>}

          {mode === "login" ? (
            <form onSubmit={submitLogin}>
              <label className="field">Email
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </label>
              <label className="field">Password
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </label>
              <button type="submit" disabled={loading} className="primary w-full disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Please wait…" : "Log in to CivicPulse"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitSignup}>
              <label className="field">Full name
                <input required name="name" value={signup.name} onChange={changeSignup} placeholder="Your name" />
              </label>
              <label className="field">Portal role
                <select name="role" value={signup.role} onChange={changeSignup}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              {role?.requiresDepartment && (
                <label className="field">Department <em className="not-italic text-[#de4e54]">*</em>
                  <select required name="department" value={signup.department} onChange={changeSignup}>
                    <option value="">Select a department</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              )}
              {role?.requiresDepartment && (
                <label className="field">Sub-department <span className="font-normal text-[#8995a9]">(optional)</span>
                  <input name="subDepartment" value={signup.subDepartment} onChange={changeSignup} placeholder="e.g. Roads & Potholes" />
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">Ward <span className="font-normal text-[#8995a9]">(optional)</span>
                  <input name="ward" value={signup.ward} onChange={changeSignup} placeholder="Ward 14" />
                </label>
                {role?.requiresDepartment && (
                  <label className="field">Zone <span className="font-normal text-[#8995a9]">(optional)</span>
                    <input name="zone" value={signup.zone} onChange={changeSignup} placeholder="Zone 2" />
                  </label>
                )}
              </div>
              <label className="field">Mobile No
                <input required type="tel" inputMode="numeric" name="mobile" value={signup.mobile} onChange={changeSignup} placeholder="Enter 10 digit phone number" />
              </label>
              <label className="field">Email
                <input required type="email" name="email" value={signup.email} onChange={changeSignup} placeholder="you@example.com" />
              </label>
              <label className="field">Password
                <input required type="password" name="password" value={signup.password} onChange={changeSignup} placeholder="••••••••" />
              </label>
              <button type="submit" disabled={loading} className="primary w-full disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Please wait…" : "Create account"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}