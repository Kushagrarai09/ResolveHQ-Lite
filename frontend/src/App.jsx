import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp, ClipboardList, Clock3, Filter, LayoutDashboard, LogOut, MessageSquare, Plus, Search, ShieldCheck, Ticket, Trash2, X } from "lucide-react";
const API = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/$/, "");
const emptyForm = { title: "", description: "", priority: "medium" };

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("resolvehq_token") || "");
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("resolvehq_user") || "null"); } catch { return null; } });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState({ search: "", status: "all", priority: "all" });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
    let data; try { data = await response.json(); } catch { throw new Error("The API returned an unreadable response."); }
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  };
  const flash = (text, type = "success") => { setNotice({ text, type }); window.setTimeout(() => setNotice({ text: "", type: "" }), 4200); };

  async function loadTickets() {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "8" });
      if (query.search.trim()) params.set("search", query.search.trim());
      if (query.status !== "all") params.set("status", query.status);
      if (query.priority !== "all") params.set("priority", query.priority);
      const data = await request(`/tickets?${params}`);
      setTickets(data.data.tickets || []); setPages(data.data.pagination?.pages || 1); setTotal(data.data.pagination?.total || 0);
    } catch (error) { flash(error.message, "error"); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (token) loadTickets(); }, [token, page, query.status, query.priority]);
  useEffect(() => { const timer = window.setTimeout(() => { if (page !== 1) setPage(1); else if (token) loadTickets(); }, 280); return () => window.clearTimeout(timer); }, [query.search]);
  useEffect(() => {
    if (!token) return;
    request("/auth/me").then(data => { setUser(data.data.user); localStorage.setItem("resolvehq_user", JSON.stringify(data.data.user)); }).catch(() => logout(false));
  }, []);

  async function authenticate(event) {
    event.preventDefault(); setAuthLoading(true);
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const data = await request(endpoint, { method: "POST", body: JSON.stringify(authForm) });
      const nextToken = data.data.token; const nextUser = data.data.user;
      localStorage.setItem("resolvehq_token", nextToken); localStorage.setItem("resolvehq_user", JSON.stringify(nextUser));
      setToken(nextToken); setUser(nextUser); flash(authMode === "login" ? "Welcome back." : "Your account is ready.");
    } catch (error) { flash(error.message, "error"); }
    finally { setAuthLoading(false); }
  }
  function logout(showNotice = true) { localStorage.removeItem("resolvehq_token"); localStorage.removeItem("resolvehq_user"); setToken(""); setUser(null); setTickets([]); setCommentsFor(null); if (showNotice) flash("You have signed out."); }

  async function saveTicket(event) {
    event.preventDefault();
    try {
      if (editing) await request(`/tickets/${editing._id}`, { method: "PATCH", body: JSON.stringify(form) });
      else await request("/tickets", { method: "POST", body: JSON.stringify(form) });
      setForm(emptyForm); setEditing(null); setShowCreate(false); flash(editing ? "Ticket updated." : "Ticket created."); await loadTickets();
    } catch (error) { flash(error.message, "error"); }
  }
  function startEdit(ticket) { setEditing(ticket); setForm({ title: ticket.title, description: ticket.description, priority: ticket.priority }); setShowCreate(true); }
  async function changeStatus(ticket, status) {
    try { await request(`/tickets/${ticket._id}`, { method: "PATCH", body: JSON.stringify({ status }) }); flash("Ticket status updated."); await loadTickets(); }
    catch (error) { flash(error.message, "error"); }
  }
  async function removeTicket(ticket) {
    if (!window.confirm(`Delete “${ticket.title}”? This also deletes its comments.`)) return;
    try { await request(`/tickets/${ticket._id}`, { method: "DELETE" }); flash("Ticket deleted."); await loadTickets(); }
    catch (error) { flash(error.message, "error"); }
  }
  async function openComments(ticket) {
    setCommentsFor(ticket); setComments([]); setCommentText("");
    try { const data = await request(`/tickets/${ticket._id}/comments`); setComments(data.data.comments || []); }
    catch (error) { flash(error.message, "error"); }
  }
  async function addComment(event) {
    event.preventDefault(); if (!commentsFor || !commentText.trim()) return;
    try { await request(`/tickets/${commentsFor._id}/comments`, { method: "POST", body: JSON.stringify({ text: commentText }) }); setCommentText(""); const data = await request(`/tickets/${commentsFor._id}/comments`); setComments(data.data.comments || []); flash("Comment added."); }
    catch (error) { flash(error.message, "error"); }
  }

  const stats = useMemo(() => ({ open: tickets.filter(t => t.status === "open").length, progress: tickets.filter(t => t.status === "in_progress").length, resolved: tickets.filter(t => t.status === "resolved").length }), [tickets]);
  if (!token) return <AuthScreen mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} submit={authenticate} loading={authLoading} notice={notice} />;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-symbol"><Ticket size={20}/></span><span>resolve<span className="brand-light">hq</span></span><span className="lite-pill">LITE</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className="nav-item active"><LayoutDashboard size={17}/> Overview</button>
      <button className="nav-item" onClick={() => { setQuery(q => ({ ...q, status: "all" })); setPage(1); }}><ClipboardList size={17}/> All tickets <span className="nav-count">{total}</span></button>
      <div className="workspace-label section-label">VIEWS</div>
      <button className="nav-item" onClick={() => { setQuery(q => ({ ...q, status: "open" })); setPage(1); }}><span className="nav-dot amber"/> Open tickets</button>
      <button className="nav-item" onClick={() => { setQuery(q => ({ ...q, status: "in_progress" })); setPage(1); }}><span className="nav-dot blue"/> In progress</button>
      <button className="nav-item" onClick={() => { setQuery(q => ({ ...q, status: "resolved" })); setPage(1); }}><span className="nav-dot green"/> Resolved</button>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>This is your support workspace demo.</p><a href="https://github.com" target="_blank" rel="noreferrer">Project resources ↗</a></div><div className="profile-row"><div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div><div className="profile-copy"><strong>{user?.name || "User"}</strong><span>{user?.email}</span></div><button className="icon-button logout-button" title="Sign out" onClick={() => logout()}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-right"><span className="secure-label"><ShieldCheck size={15}/> Personal workspace</span><div className="avatar small-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div></div></header>
      <div className="content-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR SUPPORT DESK</div><h1>Good to see you, {user?.name?.split(" ")[0] || "there"} <span className="wave">✦</span></h1><p className="subheading">Here’s what’s happening with your support tickets today.</p></div><button className="primary-button" onClick={() => { setEditing(null); setForm(emptyForm); setShowCreate(true); }}><Plus size={17}/> New ticket</button></section>
        {notice.text && <div className={`toast ${notice.type}`}><span>{notice.type === "error" ? "!" : "✓"}</span>{notice.text}<button onClick={() => setNotice({ text: "", type: "" })}><X size={15}/></button></div>}
        <section className="stats-grid">
          <StatCard title="Total tickets" value={total} note="Matching your current filters" icon={<Ticket size={18}/>} tone="violet" trend={<ArrowUpRight size={15}/>} />
          <StatCard title="Open" value={stats.open} note="Waiting for attention" icon={<Clock3 size={18}/>} tone="orange" trend={<Activity size={15}/>} />
          <StatCard title="In progress" value={stats.progress} note="Currently being handled" icon={<Activity size={18}/>} tone="blue" trend={<ArrowDownRight size={15}/>} />
          <StatCard title="Resolved" value={stats.resolved} note="Completed tickets on this page" icon={<Check size={18}/>} tone="green" trend={<ArrowUpRight size={15}/>} />
        </section>
        <section className="tickets-section">
          <div className="section-heading"><div><h2>Tickets <span className="count-chip">{total}</span></h2><p>Manage and follow up on your support requests.</p></div><button className="secondary-button" onClick={loadTickets}><Activity size={15}/> Refresh</button></div>
          <div className="filter-bar"><div className="search-box"><Search size={17}/><input placeholder="Search ticket titles..." value={query.search} onChange={e => setQuery(q => ({ ...q, search: e.target.value }))}/>{query.search && <button onClick={() => setQuery(q => ({ ...q, search: "" }))}><X size={14}/></button>}</div><div className="filter-control"><Filter size={15}/><select value={query.status} onChange={e => { setQuery(q => ({ ...q, status: e.target.value })); setPage(1); }}><option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select><ChevronDown size={14}/></div><div className="filter-control"><select value={query.priority} onChange={e => { setQuery(q => ({ ...q, priority: e.target.value })); setPage(1); }}><option value="all">All priorities</option><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option></select><ChevronDown size={14}/></div></div>
          <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Priority</th><th>Status</th><th>Created</th><th className="actions-head">Actions</th></tr></thead><tbody>
            {loading && <tr><td colSpan="5"><div className="table-state"><span className="spinner"/> Loading your tickets...</div></td></tr>}
            {!loading && tickets.length === 0 && <tr><td colSpan="5"><div className="empty-state"><div className="empty-art"><ClipboardList size={25}/></div><h3>No tickets found</h3><p>Create a ticket or change your search filters.</p><button className="primary-button compact" onClick={() => { setEditing(null); setForm(emptyForm); setShowCreate(true); }}><Plus size={15}/> Create a ticket</button></div></td></tr>}
            {!loading && tickets.map(ticket => <tr key={ticket._id}><td><div className="ticket-cell"><div className="ticket-avatar"><Ticket size={16}/></div><div className="ticket-title-copy"><button className="ticket-title" onClick={() => openComments(ticket)}>{ticket.title}</button><span>{ticket.description.length > 78 ? `${ticket.description.slice(0,78)}…` : ticket.description}</span><button className="comment-link" onClick={() => openComments(ticket)}><MessageSquare size={12}/> Comments</button></div></div></td><td><span className={`priority-pill ${ticket.priority}`}><i/>{ticket.priority}</span></td><td><select aria-label={`Status for ${ticket.title}`} className={`status-select ${ticket.status}`} value={ticket.status} onChange={e => changeStatus(ticket, e.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></td><td><span className="date-cell">{new Date(ticket.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></td><td><div className="row-actions"><button title="Edit ticket" onClick={() => startEdit(ticket)} className="action-link">Edit</button><button title="Delete ticket" onClick={() => removeTicket(ticket)} className="action-icon danger"><Trash2 size={15}/></button></div></td></tr>)}
          </tbody></table></div>
          <div className="table-footer"><span>Showing {tickets.length ? (page - 1) * 8 + 1 : 0}–{Math.min((page - 1) * 8 + tickets.length, total)} of {total} tickets</span><div className="pagination"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page <strong>{page}</strong> of {pages}</span><button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button></div></div>
        </section>
        <footer className="page-footer"><span>© {new Date().getFullYear()} ResolveHQ Lite</span><span><span className="footer-dot"/> API connected · Node.js + Express + MongoDB</span></footer>
      </div>
    </main>
    {showCreate && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { setShowCreate(false); setEditing(null); } }}><section className="modal"><div className="modal-heading"><div><div className="eyebrow">TICKET MANAGEMENT</div><h2>{editing ? "Edit ticket" : "Create a ticket"}</h2><p>Share the details so you can track the issue.</p></div><button className="icon-button" onClick={() => { setShowCreate(false); setEditing(null); }}><X size={19}/></button></div><form onSubmit={saveTicket} className="ticket-form"><label>Title<input autoFocus required minLength="3" maxLength="120" placeholder="e.g. Unable to access my account" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/></label><label>Description<textarea required minLength="1" maxLength="5000" rows="4" placeholder="Describe the issue in a few sentences..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/></label><label>Priority<select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</button><button className="primary-button"><Plus size={16}/>{editing ? "Save changes" : "Create ticket"}</button></div></form></section></div>}
    {commentsFor && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setCommentsFor(null); }}><section className="modal comments-modal"><div className="modal-heading"><div><div className="eyebrow">TICKET DISCUSSION</div><h2>{commentsFor.title}</h2><p>Comments for this ticket</p></div><button className="icon-button" onClick={() => setCommentsFor(null)}><X size={19}/></button></div><div className="comments-list">{comments.length === 0 ? <div className="comments-empty"><MessageSquare size={22}/><p>No comments yet. Start the conversation.</p></div> : comments.map(c => <article className="comment-item" key={c._id}><div className="avatar comment-avatar">{c.author?.name?.charAt(0)?.toUpperCase() || "U"}</div><div><div className="comment-meta"><strong>{c.author?.name || "User"}</strong><span>{new Date(c.createdAt).toLocaleString()}</span></div><p>{c.text}</p></div></article>)}</div><form onSubmit={addComment} className="comment-form"><textarea rows="3" required maxLength="2000" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)}/><button className="primary-button"><MessageSquare size={15}/> Add comment</button></form></section></div>}
  </div>;
}

function StatCard({ title, value, note, icon, tone, trend }) { return <article className="stat-card"><div className="stat-top"><span>{title}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><div className="stat-value-row"><strong>{value}</strong><span className={`stat-trend ${tone}`}>{trend}</span></div><p>{note}</p></article>; }
function AuthScreen({ mode, setMode, form, setForm, submit, loading, notice }) { return <main className="auth-screen"><div className="auth-decoration decor-one"/><div className="auth-decoration decor-two"/><section className="auth-panel"><div className="brand auth-brand"><span className="brand-symbol"><Ticket size={20}/></span><span>resolve<span className="brand-light">hq</span></span><span className="lite-pill">LITE</span></div><div className="auth-intro"><div className="eyebrow"><span className="eyebrow-line"/> SUPPORT WORKSPACE</div><h1>{mode === "login" ? "Welcome back." : "Your work, resolved."}</h1><p>{mode === "login" ? "Sign in to pick up where you left off." : "Create an account to manage your support tickets."}</p></div><div className="auth-tabs"><button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Sign in</button><button className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>Create account</button></div><form onSubmit={submit} className="auth-form">{mode === "register" && <label>Full name<input required minLength="2" maxLength="80" autoComplete="name" placeholder="Alex Morgan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/></label>}<label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/></label><label>Password<input required minLength="8" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}/></label>{notice.text && <div className={`auth-notice ${notice.type}`}>{notice.text}</div>}<button className="primary-button auth-submit" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Sign in to workspace" : "Create your account"}<span>→</span></button></form><div className="auth-bottom"><ShieldCheck size={15}/> Your account and tickets are private.</div></section><div className="auth-side"><div className="auth-side-content"><div className="mini-label"><span className="pulse-dot"/> SIMPLE SUPPORT, BETTER FLOW</div><h2>Every issue has<br/>a path to <em>resolved.</em></h2><p>A focused workspace to capture issues, prioritize work, and keep conversations together.</p><div className="preview-card"><div className="preview-head"><span><span className="preview-dot"/> Your ticket workspace</span><span>LIVE PREVIEW</span></div><div className="preview-stat-row"><div><span>Open tickets</span><strong>08</strong></div><div><span>In progress</span><strong>04</strong></div><div><span>Resolved</span><strong>26</strong></div></div><div className="preview-ticket"><div className="preview-ticket-icon"><ClipboardList size={16}/></div><div><strong>Account access issue</strong><span>Updated just now</span></div><span className="preview-status">Open</span></div><div className="preview-ticket"><div className="preview-ticket-icon green"><Check size={16}/></div><div><strong>Billing page not loading</strong><span>Resolved yesterday</span></div><span className="preview-status done">Resolved</span></div></div><div className="side-proof"><span><ShieldCheck size={15}/> Secure by design</span><span><Activity size={15}/> Built with REST APIs</span></div></div></div><div className="auth-copyright">RESOLVEHQ LITE <span>•</span> NODE.JS · EXPRESS · MONGODB</div></main>; }
