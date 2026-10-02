import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

type Tournament = { id: string; name: string; game: string; format: string; starts_at: string; status: string; description: string | null }

function Layout({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const navigate = useNavigate()
  async function logout() { await supabase.auth.signOut(); navigate('/') }
  return <div className="shell"><header><Link className="brand" to="/">NEP <span>TOURNA</span></Link><nav><Link to="/tournaments">Tournaments</Link>{session ? <><Link to="/admin">Admin</Link><span className="user">{session.user.email}</span><button onClick={logout}>Sign out</button></> : <Link className="button" to="/login">Sign in</Link>}</nav></header><main>{children}</main><footer>NEP TOURNA · Cloudflare + Supabase</footer></div>
}

function Home() { return <section className="hero"><p className="eyebrow">TOURNAMENT PLATFORM</p><h1>Run tournaments.<br/><span>Play with your community.</span></h1><p>Manage events, registrations, schedules and results from one fast, Cloudflare-hosted app.</p><Link className="button large" to="/tournaments">Browse tournaments</Link></section> }

function Login() {
  const [mode, setMode] = useState<'signin'|'signup'>('signin'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [message,setMessage]=useState(''); const navigate=useNavigate()
  async function submit(e: FormEvent) { e.preventDefault(); setMessage(''); const result = mode==='signin' ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password}); if(result.error) setMessage(result.error.message); else { setMessage(mode==='signup'?'Check your email to confirm your account.':'Signed in.'); if(mode==='signin') navigate('/tournaments') } }
  return <section className="card auth"><h2>{mode==='signin'?'Welcome back':'Create account'}</h2><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="button" type="submit">{mode==='signin'?'Sign in':'Create account'}</button></form>{message&&<p className="message">{message}</p>}<button className="linkButton" onClick={()=>setMode(mode==='signin'?'signup':'signin')}>{mode==='signin'?'Need an account? Sign up':'Already have an account? Sign in'}</button></section>
}

function Tournaments() {
  const [items,setItems]=useState<Tournament[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('')
  useEffect(()=>{ supabase.from('tournaments').select('id,name,game,format,starts_at,status,description').order('starts_at',{ascending:true}).then(({data,error})=>{if(error)setError(error.message);setItems(data??[]);setLoading(false)}) },[])
  return <section><div className="sectionHead"><div><p className="eyebrow">EVENTS</p><h2>Tournaments</h2></div><Link className="button" to="/">Home</Link></div>{loading?<p>Loading tournaments…</p>:error?<div className="message error">{error}</div>:items.length===0?<div className="empty">No tournaments yet.</div>:<div className="grid">{items.map(t=><article className="card" key={t.id}><span className="pill">{t.status}</span><h3>{t.name}</h3><p>{t.game} · {t.format}</p><p className="muted">{new Date(t.starts_at).toLocaleString()}</p>{t.description&&<p>{t.description}</p>}</article>)}</div>}</section>
}

function AdminGuard({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const [checking,setChecking]=useState(true); const [allowed,setAllowed]=useState(false)
  useEffect(()=>{ let alive=true; (async()=>{ if(!session){if(alive)setChecking(false);return} const {data,error}=await supabase.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle(); if(alive){setAllowed(!error && !!data);setChecking(false)} })(); return ()=>{alive=false} },[session])
  if(checking) return <p>Checking admin access…</p>
  if(!session) return <Navigate to="/admin/login" replace />
  if(!allowed) return <section className="card"><h2>Admin access required</h2><p>Your account is not an administrator.</p><Link className="button" to="/tournaments">Back to tournaments</Link></section>
  return <>{children}</>
}

function AdminLogin() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [message,setMessage]=useState(''); const navigate=useNavigate()
  async function submit(e:FormEvent){e.preventDefault();setMessage('');const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setMessage(error.message);return} navigate('/admin')}
  return <section className="card auth"><p className="eyebrow">ADMIN</p><h2>Administrator sign in</h2><p className="muted">Use an existing Supabase account that has been granted administrator access.</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="button" type="submit">Sign in as admin</button></form>{message&&<p className="message error">{message}</p>}</section>
}

const emptyForm={name:'',game:'',format:'Single Elimination',description:'',starts_at:'',status:'upcoming'}
function AdminDashboard({session}:{session:Session}) {
  const [items,setItems]=useState<Tournament[]>([]); const [form,setForm]=useState(emptyForm); const [editing,setEditing]=useState<string|null>(null); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false)
  async function load(){const {data,error}=await supabase.from('tournaments').select('id,name,game,format,starts_at,status,description').order('starts_at',{ascending:true}); if(error)setMessage(error.message); else setItems(data??[])}
  useEffect(()=>{load()},[])
  function startEdit(t:Tournament){setEditing(t.id);setForm({name:t.name,game:t.game,format:t.format,description:t.description??'',starts_at:new Date(t.starts_at).toISOString().slice(0,16),status:t.status})}
  function reset(){setEditing(null);setForm(emptyForm)}
  async function save(e:FormEvent){e.preventDefault();setBusy(true);setMessage('');const payload={name:form.name.trim(),game:form.game.trim(),format:form.format,description:form.description.trim()||null,starts_at:new Date(form.starts_at).toISOString(),status:form.status};const result=editing?await supabase.from('tournaments').update(payload).eq('id',editing):await supabase.from('tournaments').insert(payload);if(result.error)setMessage(result.error.message);else{reset();await load()}setBusy(false)}
  async function remove(id:string){if(!window.confirm('Delete this tournament?'))return;setBusy(true);const {error}=await supabase.from('tournaments').delete().eq('id',id);if(error)setMessage(error.message);else await load();setBusy(false)}
  return <section><div className="sectionHead"><div><p className="eyebrow">ADMIN</p><h2>Dashboard</h2><p className="muted">Signed in as {session.user.email}</p></div><Link className="button" to="/tournaments">View public site</Link></div><div className="adminGrid"><form className="card" onSubmit={save}><h3>{editing?'Edit tournament':'Create tournament'}</h3><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Game<input required value={form.game} onChange={e=>setForm({...form,game:e.target.value})}/></label><label>Format<select value={form.format} onChange={e=>setForm({...form,format:e.target.value})}><option>Single Elimination</option><option>Double Elimination</option><option>Round Robin</option><option>Swiss</option></select></label><label>Start time<input required type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><label>Description<textarea rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="actions"><button className="button" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Create tournament'}</button>{editing&&<button type="button" className="button secondary" onClick={reset}>Cancel</button>}</div>{message&&<p className="message error">{message}</p>}</form><div><h3>Existing tournaments</h3>{items.length===0?<div className="empty">No tournaments.</div>:items.map(t=><article className="card row" key={t.id}><div><span className="pill">{t.status}</span><h3>{t.name}</h3><p className="muted">{t.game} · {new Date(t.starts_at).toLocaleString()}</p></div><div className="actions"><button className="button secondary" onClick={()=>startEdit(t)}>Edit</button><button className="button danger" onClick={()=>remove(t.id)} disabled={busy}>Delete</button></div></article>)}</div></div></section>
}

export default function App(){ const [session,setSession]=useState<Session|null>(null); useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return ()=>data.subscription.unsubscribe()},[]); return <Layout session={session}><Routes><Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/admin/login" element={<AdminLogin/>}/><Route path="/tournaments" element={<Tournaments/>}/><Route path="/admin" element={<AdminGuard session={session}><AdminDashboard session={session!}/></AdminGuard>}/><Route path="*" element={<Home/>}/></Routes></Layout> }
