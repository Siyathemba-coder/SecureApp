import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────────
// API HELPER  — all requests go to our Express backend
// ─────────────────────────────────────────────────────────────────
const API = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─────────────────────────────────────────────────────────────────
// AUTH CONTEXT
// ─────────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, username, password) => {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, username, password }),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROLE GATE
// ─────────────────────────────────────────────────────────────────
const RANK = { viewer: 0, editor: 1, admin: 2 };

function RoleGate({ require: need, children, fallback = null }) {
  const { user } = useAuth();
  if (!user || RANK[user.role] < RANK[need]) return fallback;
  return children;
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#07080c;--surface:#0f1117;--surface2:#161822;
  --border:#1e2132;--border-hi:#2a2e4a;
  --accent:#3b82f6;--accent2:#06b6d4;--accent-glow:rgba(59,130,246,.15);
  --danger:#ef4444;--success:#22c55e;--warn:#f59e0b;
  --text:#e2e4f0;--muted:#5a5f7a;
  --font:'Plus Jakarta Sans',sans-serif;--mono:'JetBrains Mono',monospace;
  --r:10px;--r-lg:18px;
}
body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh}

/* Auth */
.auth-shell{min-height:100vh;display:grid;place-items:center;background:radial-gradient(ellipse 80% 60% at 50% -10%,#0d1b3e 0%,var(--bg) 70%);padding:20px}
.auth-card{width:100%;max-width:420px;background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:40px;box-shadow:0 24px 80px rgba(0,0,0,.6);animation:cardIn .35s cubic-bezier(.22,1,.36,1)}
@keyframes cardIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:32px}
.auth-logo{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:20px}
.auth-brand-text{font-size:18px;font-weight:800;letter-spacing:-.4px}
.auth-brand-sub{font-size:11px;color:var(--muted);font-family:var(--mono);letter-spacing:.5px;margin-top:1px}
.auth-title{font-size:22px;font-weight:800;margin-bottom:6px;letter-spacing:-.4px}
.auth-sub{font-size:13px;color:var(--muted);margin-bottom:28px;line-height:1.5}
.field{margin-bottom:16px}
.field label{display:block;font-size:12px;font-weight:600;color:var(--muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
.field input{width:100%;background:var(--surface2);border:1px solid var(--border-hi);border-radius:var(--r);color:var(--text);font-family:var(--font);font-size:14px;padding:12px 14px;outline:none;transition:border-color .15s,box-shadow .15s}
.field input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
.field input::placeholder{color:var(--muted)}
.auth-btn{width:100%;padding:13px;border:none;border-radius:var(--r);background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s,transform .1s;margin-top:4px}
.auth-btn:hover{opacity:.88;transform:translateY(-1px)}
.auth-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.auth-error{background:#1e0f0f;border:1px solid #4a1515;border-radius:var(--r);padding:10px 14px;font-size:13px;color:#f87171;margin-bottom:16px}
.auth-switch{text-align:center;font-size:13px;color:var(--muted);margin-top:20px;padding-top:20px;border-top:1px solid var(--border)}
.auth-switch button{background:none;border:none;color:var(--accent);cursor:pointer;font-weight:600;font-size:13px;font-family:var(--font)}
.demo-accounts{margin-top:20px;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r)}
.demo-accounts p{font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px}
.demo-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px}
.demo-row:last-child{border-bottom:none;padding-bottom:0}
.demo-badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;font-family:var(--mono);letter-spacing:.4px}
.badge-admin{background:#1e1040;color:#a78bfa;border:1px solid #3d2080}
.badge-editor{background:#0f2a1e;color:#4ade80;border:1px solid #1a5c35}
.badge-viewer{background:#1a1f0f;color:#a3e635;border:1px solid #3a4a10}
.demo-fill{background:none;border:1px solid var(--border);color:var(--muted);padding:3px 8px;border-radius:6px;font-size:11px;cursor:pointer;font-family:var(--font);transition:all .12s}
.demo-fill:hover{border-color:var(--accent);color:var(--accent)}

/* App shell */
.app-shell{display:grid;grid-template-columns:240px 1fr;height:100vh;overflow:hidden}
.nav{background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 16px;gap:4px;overflow-y:auto}
.nav-brand{display:flex;align-items:center;gap:10px;padding:4px 8px 20px;border-bottom:1px solid var(--border);margin-bottom:12px}
.nav-logo{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:14px;flex-shrink:0}
.nav-brand-name{font-size:14px;font-weight:800;letter-spacing:-.3px}
.nav-section{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);padding:12px 8px 6px}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--muted);border:1px solid transparent;transition:all .12s;text-align:left;background:none;width:100%;font-family:var(--font)}
.nav-item:hover{background:var(--border);color:var(--text)}
.nav-item.active{background:var(--accent-glow);border-color:rgba(59,130,246,.3);color:var(--accent)}
.nav-icon{font-size:15px;flex-shrink:0;width:18px;text-align:center}
.nav-user{margin-top:auto;padding:12px 10px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px}
.nav-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:13px;font-weight:700;flex-shrink:0}
.nav-user-info{flex:1;overflow:hidden}
.nav-user-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav-user-role{font-size:10px;font-family:var(--mono);color:var(--muted)}
.logout-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;transition:color .12s;flex-shrink:0}
.logout-btn:hover{color:var(--danger)}

/* Panel */
.panel{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.panel-header{padding:18px 28px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.panel-title{font-size:18px;font-weight:800;letter-spacing:-.3px}
.panel-sub{font-size:12px;color:var(--muted);margin-top:2px}
.panel-body{flex:1;overflow-y:auto;padding:28px}
.panel-body::-webkit-scrollbar{width:4px}
.panel-body::-webkit-scrollbar-thumb{background:var(--border-hi);border-radius:4px}

/* Cards */
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px 22px}
.stat-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:8px}
.stat-value{font-size:28px;font-weight:800;letter-spacing:-.5px}
.stat-sub{font-size:12px;color:var(--muted);margin-top:4px}
.stat-icon{float:right;font-size:22px;opacity:.5}
.section-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:22px;margin-bottom:20px}
.section-card-title{font-size:13px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}

/* Table */
.user-table{width:100%;border-collapse:collapse}
.user-table th{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);padding:8px 12px;border-bottom:1px solid var(--border);text-align:left}
.user-table td{padding:11px 12px;border-bottom:1px solid var(--border);font-size:13px}
.user-table tr:last-child td{border-bottom:none}
.user-table tr:hover td{background:var(--surface2)}

/* Chat */
.chat-wrap{display:flex;flex-direction:column;height:100%}
.chat-messages{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px}
.chat-messages::-webkit-scrollbar{width:4px}
.chat-messages::-webkit-scrollbar-thumb{background:var(--border-hi);border-radius:4px}
.msg{display:flex;gap:10px;animation:msgIn .2s ease}
@keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.msg.user{flex-direction:row-reverse}
.msg-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:13px;flex-shrink:0;margin-top:2px}
.msg-avatar.user-av{background:linear-gradient(135deg,var(--accent),var(--accent2))}
.msg-avatar.ai-av{background:var(--surface2);border:1px solid var(--border-hi)}
.bubble{max-width:70%;padding:12px 16px;font-size:14px;line-height:1.65;border-radius:18px}
.bubble.user{background:var(--accent);color:#fff;border-radius:18px 18px 4px 18px}
.bubble.assistant{background:var(--surface2);border:1px solid var(--border);border-radius:18px 18px 18px 4px}
.bubble.err{background:#1e0f0f;border:1px solid #4a1515;color:#f87171;border-radius:var(--r)}
.bubble pre{background:rgba(0,0,0,.3);border-radius:6px;padding:10px;font-family:var(--mono);font-size:11px;margin:8px 0;overflow-x:auto;white-space:pre-wrap}
.bubble code:not(pre code){background:rgba(0,0,0,.3);border-radius:4px;padding:1px 5px;font-family:var(--mono);font-size:12px}
.msg-time{font-size:10px;color:var(--muted);font-family:var(--mono);margin-top:4px;padding:0 4px}
.msg.user .msg-time{text-align:right}
.dots{display:flex;gap:4px;padding:12px 16px}
.dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:b .8s infinite}
.dot:nth-child(2){animation-delay:.15s}.dot:nth-child(3){animation-delay:.3s}
@keyframes b{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.chat-input-area{padding:16px 20px;border-top:1px solid var(--border);flex-shrink:0}
.chat-input-row{display:flex;gap:8px;align-items:flex-end;background:var(--surface2);border:1px solid var(--border-hi);border-radius:14px;padding:10px 12px;transition:border-color .15s,box-shadow .15s}
.chat-input-row:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
.chat-input-row textarea{flex:1;background:none;border:none;outline:none;color:var(--text);font-family:var(--font);font-size:14px;resize:none;min-height:20px;max-height:120px;line-height:1.5}
.chat-input-row textarea::placeholder{color:var(--muted)}
.send-btn{width:34px;height:34px;border-radius:9px;background:var(--accent);border:none;color:#fff;cursor:pointer;display:grid;place-items:center;font-size:16px;flex-shrink:0;transition:opacity .15s,transform .1s}
.send-btn:disabled{opacity:.3;cursor:not-allowed}
.send-btn:not(:disabled):hover{opacity:.85;transform:translateY(-1px)}

/* Misc */
.denied{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:100%;color:var(--muted);text-align:center;padding:40px}
.perm-grid{display:flex;flex-wrap:wrap;gap:8px}
.perm-chip{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;font-family:var(--mono);border:1px solid var(--border)}
.perm-chip.yes{background:#0a1f14;color:#4ade80;border-color:#1a5c35}
.perm-chip.no{background:#1a0f0f;color:#f87171;border-color:#4a1515}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;margin-right:6px}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:680px){.app-shell{grid-template-columns:1fr}.nav{display:none}.stat-grid{grid-template-columns:1fr}}
`;

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2, 9);
const tick = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmt  = (t) =>
  t.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
   .replace(/`([^`]+)`/g, "<code>$1</code>")
   .replace(/\n/g, "<br>");

// ─────────────────────────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────────────────────────
function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name: "", username: "", password: "" });
  const [err,  setErr]    = useState("");
  const [busy, setBusy]   = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      if (mode === "login") {
        if (!form.username || !form.password) throw new Error("Fill in all fields");
        await login(form.username, form.password);
      } else {
        if (!form.name || !form.username || !form.password) throw new Error("Fill in all fields");
        await signup(form.name, form.username, form.password);
      }
    } catch (e) { setErr(e.message); }
    finally    { setBusy(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">🔐</div>
          <div>
            <div className="auth-brand-text">SecureApp</div>
            <div className="auth-brand-sub">MySQL · JWT · BCRYPT · GROQ</div>
          </div>
        </div>
        <div className="auth-title">{mode === "login" ? "Welcome back" : "Create account"}</div>
        <div className="auth-sub">
          {mode === "login"
            ? "Sign in to access your dashboard."
            : "New accounts are assigned the Viewer role by default."}
        </div>
        {err && <div className="auth-error">⚠ {err}</div>}
        {mode === "signup" && (
          <div className="field"><label>Full Name</label>
            <input type="text" placeholder="Jane Smith" value={form.name} onChange={set("name")} />
          </div>
        )}
        <div className="field"><label>Username</label>
          <input type="text" placeholder="your_username" value={form.username} onChange={set("username")}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <div className="field"><label>Password</label>
          <input type="password" placeholder="••••••••" value={form.password} onChange={set("password")}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <button className="auth-btn" onClick={submit} disabled={busy}>
          {busy ? <><span className="spinner"/>Please wait…</> : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
        <div className="auth-switch">
          {mode === "login"
            ? <>Don't have an account? <button onClick={() => { setMode("signup"); setErr(""); }}>Sign up</button></>
            : <>Already have an account? <button onClick={() => { setMode("login"); setErr(""); }}>Sign in</button></>
          }
        </div>
        {mode === "login" && (
          <div className="demo-accounts">
            <p>Demo Accounts (seeded in DB)</p>
            {[
              { role: "admin",  u: "admin",  p: "Admin@123" },
              { role: "editor", u: "editor", p: "Edit@123"  },
              { role: "viewer", u: "viewer", p: "View@123"  },
            ].map(({ role, u, p }) => (
              <div className="demo-row" key={role}>
                <span className={`demo-badge badge-${role}`}>{role.toUpperCase()}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{u} / {p}</span>
                <button className="demo-fill" onClick={() => setForm(f => ({ ...f, username: u, password: p }))}>Fill</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "◈", label: "Dashboard",    require: "viewer" },
  { id: "chat",      icon: "◎", label: "AI Chat",       require: "viewer" },
  { id: "content",   icon: "✦", label: "Edit Content",  require: "editor" },
  { id: "admin",     icon: "⬡", label: "Admin Panel",   require: "admin"  },
  { id: "profile",   icon: "◉", label: "My Profile",    require: "viewer" },
];

function Nav({ active, onNav }) {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  return (
    <nav className="nav">
      <div className="nav-brand">
        <div className="nav-logo">🔐</div>
        <div><div className="nav-brand-name">SecureApp</div></div>
      </div>
      <div className="nav-section">Navigation</div>
      {NAV_ITEMS.map(item => {
        const allowed = RANK[user?.role] >= RANK[item.require];
        return (
          <button key={item.id}
            className={`nav-item ${active === item.id ? "active" : ""}`}
            onClick={() => allowed && onNav(item.id)}
            style={!allowed ? { opacity: .35, cursor: "not-allowed" } : {}}
            title={!allowed ? `Requires ${item.require} role` : ""}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {!allowed && <span style={{ marginLeft: "auto", fontSize: 12 }}>🔒</span>}
          </button>
        );
      })}
      <div className="nav-user">
        <div className="nav-avatar">{initials}</div>
        <div className="nav-user-info">
          <div className="nav-user-name">{user?.name}</div>
          <div className="nav-user-role">{user?.role}</div>
        </div>
        <button className="logout-btn" onClick={logout} title="Sign out">⏻</button>
      </div>
    </nav>
  );
}

function Denied({ need }) {
  const { user } = useAuth();
  return (
    <div className="denied">
      <div style={{ fontSize: 48, opacity: .4 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", opacity: .7 }}>Access Restricted</div>
      <div style={{ fontSize: 13, maxWidth: 280, lineHeight: 1.6 }}>Your role does not have permission to view this section.</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <div style={{ padding: "5px 14px", borderRadius: 20, background: "var(--surface2)", border: "1px solid var(--border)", fontSize: 12, fontFamily: "var(--mono)" }}>Your role: <b>{user?.role}</b></div>
        <div style={{ padding: "5px 14px", borderRadius: 20, background: "var(--surface2)", border: "1px solid var(--border)", fontSize: 12, fontFamily: "var(--mono)" }}>Required: <b>{need}</b></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth();
  const isAdmin  = user?.role === "admin";
  const isEditor = RANK[user?.role] >= RANK["editor"];
  return (
    <div className="panel-body">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-label">Logged in as</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{user?.name}</div>
          <div className="stat-sub" style={{ fontFamily: "var(--mono)", marginTop: 6 }}>@{user?.username}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎖</div>
          <div className="stat-label">Role</div>
          <div className="stat-value" style={{ fontSize: 22, textTransform: "capitalize" }}>{user?.role}</div>
          <div className="stat-sub">Stored in MySQL · Encoded in JWT</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗄</div>
          <div className="stat-label">Backend</div>
          <div className="stat-value" style={{ fontSize: 18 }}>MySQL + Express</div>
          <div className="stat-sub">JWT · bcrypt · Groq AI</div>
        </div>
      </div>
      <div className="section-card">
        <div className="section-card-title"><span>🔑</span> Your Permissions</div>
        <div className="perm-grid">
          {[
            ["View Dashboard",  true],
            ["Use AI Chat",     true],
            ["Edit Content",    isEditor],
            ["Manage Users",    isAdmin],
            ["View Admin Panel",isAdmin],
            ["Delete Records",  isAdmin],
          ].map(([label, has]) => (
            <div key={label} className={`perm-chip ${has ? "yes" : "no"}`}>
              {has ? "✓" : "✗"} {label}
            </div>
          ))}
        </div>
      </div>
      <div className="section-card">
        <div className="section-card-title"><span>🗄</span> Architecture</div>
        {[
          ["Frontend",    "React + Vite (port 5173)"],
          ["Backend",     "Node.js + Express (port 5000)"],
          ["Database",    "MySQL — users & chat_messages tables"],
          ["Auth",        "JWT tokens stored in localStorage"],
          ["Passwords",   "bcrypt with 12 salt rounds"],
          ["AI",          "Groq API — key lives in backend .env only"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", minWidth: 90 }}>{k}</span>
            <span style={{ color: "var(--muted)" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AI CHAT  — calls backend, no API key in the UI
// ─────────────────────────────────────────────────────────────────
function ChatView() {
  const { user } = useAuth();
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(true);
  const ref   = useRef(null);
  const taRef = useRef(null);

  // Load chat history from MySQL on mount
  useEffect(() => {
    request("/chat/history")
      .then(d => setMsgs(d.messages.map(m => ({ ...m, id: uid(), time: tick() }))))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const resize = () => {
    if (taRef.current) { taRef.current.style.height = "auto"; taRef.current.style.height = taRef.current.scrollHeight + "px"; }
  };

  const send = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    // Optimistically show the user message
    setMsgs(p => [...p, { id: uid(), role: "user", content: txt, time: tick() }]);
    setLoading(true);

    try {
      const data = await request("/chat/message", {
        method: "POST",
        body: JSON.stringify({ message: txt }),
      });
      setMsgs(p => [...p, { id: uid(), role: "assistant", content: data.reply, time: tick(), tokens: data.tokens }]);
    } catch (e) {
      setMsgs(p => [...p, { id: uid(), role: "error", content: `⚠ ${e.message}`, time: tick() }]);
    } finally { setLoading(false); }
  };

  const clearHistory = async () => {
    if (!confirm("Clear all chat history?")) return;
    await request("/chat/history", { method: "DELETE" }).catch(() => {});
    setMsgs([]);
  };

  if (fetching) return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--muted)" }}>
      <div><span className="spinner" style={{ borderTopColor: "var(--accent)" }}/>Loading history…</div>
    </div>
  );

  return (
    <div className="chat-wrap">
      {/* Status bar — shows model, no API key needed */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#f97316" }}>llama-3.3-70b-versatile</span>
          <span>via Groq · secured by backend</span>
        </div>
        <button onClick={clearHistory} style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "var(--font)" }}>
          Clear history
        </button>
      </div>

      <div className="chat-messages">
        {msgs.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--muted)", padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 40, opacity: .4 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", opacity: .7 }}>Groq AI Assistant</div>
            <div style={{ fontSize: 13, maxWidth: 300, lineHeight: 1.7 }}>
              Signed in as <b style={{ color: "var(--accent)" }}>{user?.name}</b>.<br />
              Your API key is stored safely on the server — just type and chat!
            </div>
          </div>
        )}
        {msgs.map(m => (
          <div key={m.id} className={`msg ${m.role === "user" ? "user" : ""}`}>
            {m.role !== "error" && (
              <div className={`msg-avatar ${m.role === "user" ? "user-av" : "ai-av"}`}>
                {m.role === "user" ? user?.name?.[0]?.toUpperCase() || "U" : "⚡"}
              </div>
            )}
            <div>
              <div className={`bubble ${m.role === "error" ? "err" : m.role}`}
                dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
              <div className="msg-time">
                {m.time}{m.tokens ? ` · ${m.tokens} tokens` : ""}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg">
            <div className="msg-avatar ai-av">⚡</div>
            <div className="bubble assistant"><div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div></div>
          </div>
        )}
        <div ref={ref} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea ref={taRef} rows={1} value={input}
            placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
            onChange={e => { setInput(e.target.value); resize(); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="send-btn" disabled={!input.trim() || loading} onClick={send}>↑</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", textAlign: "center" }}>
          History saved to MySQL · Groq free tier · 30 req/min
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CONTENT EDITOR
// ─────────────────────────────────────────────────────────────────
function ContentView() {
  const [saved, setSaved] = useState(false);
  const [text, setText]   = useState("# Welcome\n\nEdit this content as an editor or admin.");
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="panel-body">
      <div className="section-card">
        <div className="section-card-title">
          <span>✦</span> Content Editor
          {saved && <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--mono)", color: "var(--success)" }}>✓ Saved!</span>}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          style={{ width: "100%", minHeight: 200, background: "var(--bg)", border: "1px solid var(--border-hi)", borderRadius: "var(--r)", color: "var(--text)", fontFamily: "var(--mono)", fontSize: 13, padding: "12px 14px", resize: "vertical", outline: "none" }} />
        <button onClick={save} style={{ marginTop: 12, padding: "10px 22px", background: "var(--accent)", border: "none", borderRadius: "var(--r)", color: "#fff", fontFamily: "var(--font)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ADMIN PANEL  — reads/writes MySQL via backend API
// ─────────────────────────────────────────────────────────────────
function AdminView() {
  const { user: me } = useAuth();
  const [users,   setUsers]  = useState([]);
  const [loading, setLoading]= useState(true);
  const [msg,     setMsg]    = useState("");

  const load = async () => {
    try {
      const d = await request("/users");
      setUsers(d.users);
    } catch (e) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    try {
      await request(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      setUsers(p => p.map(u => u.id === id ? { ...u, role } : u));
    } catch (e) { setMsg(e.message); }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user and all their messages?")) return;
    try {
      await request(`/users/${id}`, { method: "DELETE" });
      setUsers(p => p.filter(u => u.id !== id));
    } catch (e) { setMsg(e.message); }
  };

  if (loading) return <div style={{ padding: 40, color: "var(--muted)" }}><span className="spinner"/>Loading users from MySQL…</div>;

  return (
    <div className="panel-body">
      {msg && <div className="auth-error" style={{ marginBottom: 16 }}>⚠ {msg}</div>}
      <div className="section-card">
        <div className="section-card-title"><span>⬡</span> User Management — MySQL</div>
        <table className="user-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 11 }}>{u.id}</td>
                <td>{u.name}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>@{u.username}</td>
                <td>
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    disabled={u.id === me?.id}
                    style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "var(--mono)", fontSize: 12, padding: "3px 8px", cursor: "pointer" }}>
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: u.is_active ? "var(--success)" : "var(--danger)" }}>
                    {u.is_active ? "● active" : "○ inactive"}
                  </span>
                </td>
                <td>
                  <button onClick={() => deleteUser(u.id)} disabled={u.id === me?.id}
                    style={{ background: "none", border: "1px solid var(--border)", color: "var(--danger)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, fontFamily: "var(--font)", opacity: u.id === me?.id ? .3 : 1 }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────
function ProfileView() {
  const { user, logout } = useAuth();
  const isEditor = RANK[user?.role] >= RANK["editor"];
  const isAdmin  = user?.role === "admin";
  return (
    <div className="panel-body">
      <div className="section-card">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)", marginBottom: 14 }}>Account Info</div>
          {[["Name", user?.name], ["Username", `@${user?.username}`], ["Role", user?.role], ["User ID", user?.id]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{l}</span>
              <span style={{ fontFamily: ["Username","User ID"].includes(l) ? "var(--mono)" : "inherit", fontSize: l === "User ID" ? 11 : 14 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)", marginBottom: 14 }}>Permissions</div>
          <div className="perm-grid">
            {[
              ["view:dashboard", true], ["use:chat", true],
              ["edit:content", isEditor], ["view:admin", isAdmin],
              ["manage:users", isAdmin], ["delete:records", isAdmin],
            ].map(([p, has]) => (
              <div key={p} className={`perm-chip ${has ? "yes" : "no"}`}>{has ? "✓" : "✗"} {p}</div>
            ))}
          </div>
        </div>
        <button onClick={logout} style={{ padding: "10px 20px", background: "none", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: "var(--r)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600, fontSize: 13 }}>
          ⏻ Sign Out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────
const PAGE_META = {
  dashboard: { title: "Dashboard",     sub: "Your account overview" },
  chat:      { title: "AI Assistant",  sub: "Powered by Groq · history saved to MySQL" },
  content:   { title: "Content Editor",sub: "Editor role required" },
  admin:     { title: "Admin Panel",   sub: "User management via MySQL" },
  profile:   { title: "My Profile",    sub: "Account details and permissions" },
};

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const meta = PAGE_META[page] || {};

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "chat":      return <ChatView />;
      case "content":   return <RoleGate require="editor" fallback={<Denied need="editor" />}><ContentView /></RoleGate>;
      case "admin":     return <RoleGate require="admin"  fallback={<Denied need="admin"  />}><AdminView  /></RoleGate>;
      case "profile":   return <ProfileView />;
      default:          return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <Nav active={page} onNav={setPage} />
      <main className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">{meta.title}</div>
            <div className="panel-sub">{meta.sub}</div>
          </div>
        </div>
        {renderPage()}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────
function Root() {
  const { user } = useAuth();
  return user ? <AppShell /> : <AuthPage />;
}

export default function App() {
  return (
    <>
      <style>{STYLES}</style>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </>
  );
}
