import { useState, useEffect, useRef, useCallback } from 'react'
import { useGistSync } from './useGistSync.js'

// ─── DATOS ───────────────────────────────────────────────────────────────────
const DEFAULT_PLANS = [
  { id: 'movilidad',     emoji: '🧘🏾‍♀️', name: 'Movilidad',     routines: 30 },
  { id: 'calentamiento', emoji: '🔥',      name: 'Calentamiento', routines: 20 },
  { id: 'fullbody',      emoji: '🏋🏾‍♀️', name: 'Fullbody',      routines: 80 },
  { id: 'torso',         emoji: '💪🏾',    name: 'Torso',         routines: 60 },
  { id: 'pierna',        emoji: '🦵🏾',    name: 'Pierna',        routines: 70 },
  { id: 'abs',           emoji: '🍫',      name: 'ABS',           routines: 50 },
  { id: 'cucu',          emoji: '🍑',      name: 'Cucu',          routines: 90 },
]
const PRESET_TAGS = ['silla', 'toalla', 'gomas', 'mancuernas', 'esterilla', 'pesas']

const EMPTY_STATE = {
  plans: DEFAULT_PLANS,
  activePlanId: 'fullbody',
  currentIndexByPlan: Object.fromEntries(DEFAULT_PLANS.map(p => [p.id, p.routines - 1])),
  sessions: [],
  favorites: [],
  statsFrom: null,
}

function loadLocal() {
  try { const s = localStorage.getItem('olfit-v2'); return s ? JSON.parse(s) : null } catch { return null }
}
function saveLocal(data) {
  try { localStorage.setItem('olfit-v2', JSON.stringify(data)) } catch {}
}
function loadCreds() {
  try { return JSON.parse(localStorage.getItem('olfit-creds') || 'null') } catch { return null }
}
function saveCreds(c) {
  try { localStorage.setItem('olfit-creds', JSON.stringify(c)) } catch {}
}

function today() { return new Date().toISOString().split('T')[0] }
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
function weekKey(iso) {
  const d = new Date(iso + 'T00:00:00')
  const j = new Date(d.getFullYear(), 0, 1)
  return `${d.getFullYear()}-W${Math.ceil(((d - j) / 86400000 + j.getDay() + 1) / 7)}`
}
function monthKey(iso) { return iso.slice(0, 7) }
function yearKey(iso)  { return iso.slice(0, 4) }
function favKey(planId, num) { return `${planId}-${num}` }

// ─── ICONOS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const p = {
    check:   'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    skip:    'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
    home:    'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    history: 'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
    stats:   'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    settings:'M19.14,12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4,2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24,0-.43.17-.47.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-.22-.08-.47,0-.59.22L2.74,8.87c-.12.21-.08.47.12.61l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s.02.64.07.94l-2.03,1.58c-.18.14-.23.41-.12.61l1.92,3.32c.12.22.37.29.59.22l2.39-.96c.5.38,1.03.7,1.62.94l.36,2.54c.05.24.24.41.48.41h3.84c.24,0,.44-.17.47-.41l.36-2.54c.59-.24,1.13-.56,1.62-.94l2.39.96c.22.08.47,0,.59-.22l1.92-3.32c.12-.22.07-.47-.12-.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6,3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z',
    add:     'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    edit:    'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    delete:  'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    close:   'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    fire:    'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    star:    'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    starOff: 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z',
    bell:    'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    flag:    'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
    sync:    'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
    cloud:   'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
    key:     'M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
    ok:      'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d={p[name] || p.ok}/>
    </svg>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState]     = useState(() => loadLocal() || EMPTY_STATE)
  const [creds, setCreds]     = useState(() => loadCreds())   // { token, gistId, username }
  const [screen, setScreen]   = useState('home')
  const [modal, setModal]     = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | ok | error
  const [sessionDraft, setSessionDraft] = useState({ tags: [], note: '', routineOverride: null })
  const [filterTag,  setFilterTag]  = useState(null)
  const [filterFav,  setFilterFav]  = useState(false)
  const [filterPlan, setFilterPlan] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null)
  const [newPlanDraft, setNewPlanDraft] = useState({ emoji: '💪🏾', name: '', routines: 30 })
  const [showReminder, setShowReminder] = useState(true)
  const reminderDismissed = useRef(false)
  const saveTimer = useRef(null)

  const { saveToGist, loadFromGist, createGist, verifyToken } = useGistSync()

  // ── Persistir localmente + sync a Gist con debounce ──
  useEffect(() => {
    saveLocal(state)
    if (!creds?.token || !creds?.gistId) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSyncStatus('syncing')
      const result = await saveToGist(creds.token, creds.gistId, state)
      setSyncStatus(result.ok ? 'ok' : 'error')
      setTimeout(() => setSyncStatus('idle'), 2500)
    }, 1500)
  }, [state])

  // ── Cargar desde Gist al iniciar ──
  useEffect(() => {
    if (!creds?.token || !creds?.gistId) return
    ;(async () => {
      setSyncStatus('syncing')
      const remote = await loadFromGist(creds.token, creds.gistId)
      if (remote) {
        setState(remote)
        saveLocal(remote)
        setSyncStatus('ok')
        setTimeout(() => setSyncStatus('idle'), 2000)
      } else {
        setSyncStatus('idle')
      }
    })()
  }, [])

  const activePlan   = state.plans.find(p => p.id === state.activePlanId) || state.plans[0]
  const currentIndex = (state.currentIndexByPlan || {})[activePlan.id] ?? activePlan.routines - 1
  const currentRoutine = currentIndex + 1

  function setCurrentIndex(planId, idx) {
    setState(s => ({ ...s, currentIndexByPlan: { ...s.currentIndexByPlan, [planId]: idx } }))
  }

  // Streak
  const streakDays = (() => {
    const days = [...new Set(state.sessions.map(s => s.date))].sort().reverse()
    if (!days.length) return 0
    let streak = 0, check = today()
    for (const d of days) {
      if (d === check) {
        streak++
        const dt = new Date(check + 'T00:00:00'); dt.setDate(dt.getDate() - 1)
        check = dt.toISOString().split('T')[0]
      } else if (d < check) break
    }
    return streak
  })()

  const isFav = (planId, num) => (state.favorites || []).includes(favKey(planId, num))
  function toggleFav(planId, num) {
    const key = favKey(planId, num)
    setState(s => ({ ...s, favorites: s.favorites.includes(key) ? s.favorites.filter(f => f !== key) : [...s.favorites, key] }))
  }

  function logSession() {
    const routineNum = sessionDraft.routineOverride !== null ? sessionDraft.routineOverride : currentRoutine
    const session = {
      id: Date.now().toString(),
      date: today(),
      planId: activePlan.id,
      planName: `${activePlan.emoji} ${activePlan.name}`,
      routineNumber: routineNum,
      tags: sessionDraft.tags,
      note: sessionDraft.note,
    }
    const nextIndex = currentIndex - 1 < 0 ? activePlan.routines - 1 : currentIndex - 1
    setState(s => ({ ...s, sessions: [session, ...s.sessions] }))
    setCurrentIndex(activePlan.id, nextIndex)
    setModal(null)
    setSessionDraft({ tags: [], note: '', routineOverride: null })
  }

  function computeStats() {
    const t = today(), wk = weekKey(t), mo = monthKey(t), yr = yearKey(t)
    const from = state.statsFrom || '0000-00-00'
    const counted = state.sessions.filter(s => s.date >= from)
    const byPlan = {}, tagCount = {}
    counted.forEach(s => {
      byPlan[s.planName] = (byPlan[s.planName] || 0) + 1
      s.tags.forEach(tag => { tagCount[tag] = (tagCount[tag] || 0) + 1 })
    })
    return {
      thisWeek:  counted.filter(s => weekKey(s.date)  === wk).length,
      thisMonth: counted.filter(s => monthKey(s.date) === mo).length,
      thisYear:  counted.filter(s => yearKey(s.date)  === yr).length,
      total: counted.length, byPlan, tagCount,
      statsFrom: state.statsFrom,
    }
  }
  const stats = computeStats()

  const allTags = [...new Set(state.sessions.flatMap(s => s.tags))]
  const allHistPlanNames = [...new Set(state.sessions.map(s => s.planName))]
  const filteredSessions = state.sessions.filter(s => {
    if (filterTag  && !s.tags.includes(filterTag)) return false
    if (filterPlan && s.planName !== filterPlan)   return false
    if (filterFav  && !isFav(s.planId, s.routineNumber)) return false
    return true
  })

  // ─── SYNC BADGE ───────────────────────────────────────────────────────────
  const SyncBadge = () => {
    if (!creds?.token) return null
    const cfg = {
      syncing: { color: '#f59e0b', icon: 'sync',  label: 'Sincronizando...' },
      ok:      { color: '#22c55e', icon: 'cloud',  label: 'Sincronizado' },
      error:   { color: '#ef4444', icon: 'cloud',  label: 'Error sync' },
      idle:    { color: '#94a3b8', icon: 'cloud',  label: 'Gist conectado' },
    }[syncStatus]
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: cfg.color, fontWeight: 600 }}>
        <Icon name={cfg.icon} size={14}/>{cfg.label}
      </div>
    )
  }

  // ─── HOME ─────────────────────────────────────────────────────────────────
  const HomeScreen = () => {
    const reminderText = (() => {
      if (!state.sessions.length) return null
      const last = state.sessions[0]
      if (last.planId === activePlan.id)
        return `La última vez hiciste ${last.planName} R${last.routineNumber}`
      return `Última sesión: ${last.planName} R${last.routineNumber} · ${formatDate(last.date)}`
    })()

    return (
      <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 30, fontFamily: "'Bebas Neue', cursive", letterSpacing: 3, color: '#0f172a' }}>OlFit</div>
            <SyncBadge/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {streakDays > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: 20, padding: '5px 12px' }}>
                <Icon name="fire" size={14}/><span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{streakDays}d</span>
              </div>
            )}
          </div>
        </div>

        {/* Reminder */}
        {reminderText && showReminder && !reminderDismissed.current && (
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <Icon name="bell" size={15}/>
              <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 500 }}>{reminderText}</span>
            </div>
            <button onClick={() => { reminderDismissed.current = true; setShowReminder(false) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}>
              <Icon name="close" size={15}/>
            </button>
          </div>
        )}

        {/* Plan selector */}
        <div style={{ background: 'white', borderRadius: 16, padding: 14, boxShadow: '0 2px 12px rgba(30,64,175,0.08)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Plan activo</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {state.plans.map(plan => (
              <button key={plan.id} onClick={() => setState(s => ({ ...s, activePlanId: plan.id }))}
                style={{ padding: '6px 11px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all .18s',
                  background: state.activePlanId === plan.id ? '#1e3a8a' : '#f1f5f9',
                  color:      state.activePlanId === plan.id ? 'white'   : '#475569' }}>
                {plan.emoji} {plan.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current routine card */}
        <div style={{ background: 'linear-gradient(135deg,#0f2a6b 0%,#1d4ed8 65%,#3b82f6 100%)',
          borderRadius: 22, padding: '22px 24px', color: 'white', boxShadow: '0 10px 40px rgba(30,58,138,0.4)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, opacity: .65 }}>Siguiente rutina</div>
              <div style={{ fontSize: 13, opacity: .85, marginTop: 2 }}>{activePlan.emoji} {activePlan.name}</div>
            </div>
            <button onClick={() => toggleFav(activePlan.id, currentRoutine)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: 6, cursor: 'pointer',
                color: isFav(activePlan.id, currentRoutine) ? '#fbbf24' : 'rgba(255,255,255,0.55)' }}>
              <Icon name={isFav(activePlan.id, currentRoutine) ? 'star' : 'starOff'} size={18}/>
            </button>
          </div>
          <div style={{ fontSize: 78, fontFamily: "'Bebas Neue', cursive", letterSpacing: 4, lineHeight: 1, marginTop: 6 }}>
            {String(currentRoutine).padStart(2, '0')}
            <span style={{ fontSize: 28, opacity: .4 }}>/{activePlan.routines}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 6, height: 6, marginTop: 8 }}>
            <div style={{ height: '100%', borderRadius: 6, background: 'white', width: `${(currentRoutine / activePlan.routines) * 100}%`, transition: 'width .4s' }}/>
          </div>
          <div style={{ fontSize: 10, opacity: .55, marginTop: 4 }}>{activePlan.routines - currentRoutine + 1} rutinas restantes en este ciclo</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => { setSessionDraft({ tags: [], note: '', routineOverride: null }); setModal('log') }}
              style={{ flex: 1, padding: '13px 0', borderRadius: 13, border: 'none', cursor: 'pointer', background: 'white', color: '#1e3a8a', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="check" size={17}/>Completar
            </button>
            <button onClick={() => setModal('skip')}
              style={{ padding: '13px 15px', borderRadius: 13, border: '2px solid rgba(255,255,255,0.4)', cursor: 'pointer', background: 'transparent', color: 'white', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="skip" size={16}/>Saltar
            </button>
          </div>
        </div>

        {/* Progreso visual por plan */}
        <div style={{ background: 'white', borderRadius: 16, padding: 15, boxShadow: '0 2px 12px rgba(30,64,175,0.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Progreso por plan</div>
          {state.plans.map(plan => {
            const done = state.sessions.filter(s => s.planId === plan.id).length
            const inCycle = done % plan.routines
            const cycles = Math.floor(done / plan.routines)
            const pct = plan.routines > 0 ? (inCycle / plan.routines) * 100 : 0
            const curIdx = (state.currentIndexByPlan || {})[plan.id] ?? plan.routines - 1
            return (
              <div key={plan.id} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{plan.emoji} {plan.name}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    R{curIdx + 1}/{plan.routines}
                    {cycles > 0 && <span style={{ color: '#60a5fa', marginLeft: 4 }}>×{cycles}</span>}
                  </span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 6, height: 7 }}>
                  <div style={{ height: '100%', borderRadius: 6, transition: 'width .5s',
                    background: state.activePlanId === plan.id ? 'linear-gradient(90deg,#1e3a8a,#3b82f6)' : '#94a3b8',
                    width: `${pct}%` }}/>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mini stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[{ l: 'Semana', v: stats.thisWeek }, { l: 'Mes', v: stats.thisMonth }, { l: 'Año', v: stats.thisYear }].map(s => (
            <div key={s.l} style={{ background: 'white', borderRadius: 14, padding: '13px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(30,64,175,0.07)' }}>
              <div style={{ fontSize: 30, fontFamily: "'Bebas Neue', cursive", color: '#1e3a8a' }}>{s.v}</div>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── HISTORIAL ────────────────────────────────────────────────────────────
  const HistoryScreen = () => (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ fontSize: 24, fontFamily: "'Bebas Neue', cursive", letterSpacing: 2, color: '#0f172a' }}>Historial</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <button onClick={() => setFilterFav(f => !f)}
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            borderColor: filterFav ? '#f59e0b' : '#e2e8f0', background: filterFav ? '#fef3c7' : 'white', color: filterFav ? '#92400e' : '#64748b' }}>
          <Icon name="star" size={14}/>Solo favoritas
        </button>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterPlan(null)} style={{ padding: '4px 10px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 11, fontWeight: 700, borderColor: !filterPlan ? '#1e3a8a' : '#e2e8f0', background: !filterPlan ? '#1e3a8a' : 'white', color: !filterPlan ? 'white' : '#64748b' }}>Todos</button>
          {allHistPlanNames.map(n => <button key={n} onClick={() => setFilterPlan(filterPlan === n ? null : n)} style={{ padding: '4px 10px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 11, fontWeight: 700, borderColor: filterPlan === n ? '#1e3a8a' : '#e2e8f0', background: filterPlan === n ? '#1e3a8a' : 'white', color: filterPlan === n ? 'white' : '#64748b' }}>{n}</button>)}
        </div>
        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allTags.map(t => <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} style={{ padding: '4px 10px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 11, fontWeight: 600, borderColor: filterTag === t ? '#3b82f6' : '#e2e8f0', background: filterTag === t ? '#dbeafe' : 'white', color: filterTag === t ? '#1e40af' : '#64748b' }}>{t}</button>)}
          </div>
        )}
      </div>
      {filteredSessions.length === 0
        ? <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 50, fontSize: 14 }}>Sin sesiones con ese filtro</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {filteredSessions.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: 14, padding: '13px 15px', boxShadow: '0 2px 10px rgba(30,64,175,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 14 }}>{s.planName} · R{s.routineNumber}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{formatDate(s.date)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => toggleFav(s.planId, s.routineNumber)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isFav(s.planId, s.routineNumber) ? '#f59e0b' : '#cbd5e1' }}>
                      <Icon name={isFav(s.planId, s.routineNumber) ? 'star' : 'starOff'} size={17}/>
                    </button>
                    <button onClick={() => setState(st => ({ ...st, sessions: st.sessions.filter(x => x.id !== s.id) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e2e8f0' }}>
                      <Icon name="delete" size={16}/>
                    </button>
                  </div>
                </div>
                {s.tags.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                  {s.tags.map(t => <span key={t} style={{ background: '#dbeafe', color: '#1e40af', fontSize: 10, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{t}</span>)}
                </div>}
                {s.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>"{s.note}"</div>}
              </div>
            ))}
          </div>
      }
    </div>
  )

  // ─── STATS ────────────────────────────────────────────────────────────────
  const StatsScreen = () => {
    const byPlanEntries = Object.entries(stats.byPlan).sort((a,b) => b[1]-a[1])
    const tagEntries    = Object.entries(stats.tagCount).sort((a,b) => b[1]-a[1])
    return (
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ fontSize: 24, fontFamily: "'Bebas Neue', cursive", letterSpacing: 2, color: '#0f172a' }}>Estadísticas</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
          {[{ l: 'Total', v: stats.total, i: 'check' }, { l: 'Racha', v: `${streakDays}d`, i: 'fire' }, { l: 'Semana', v: stats.thisWeek, i: 'flag' }, { l: 'Mes', v: stats.thisMonth, i: 'stats' }].map(item => (
            <div key={item.l} style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 10px rgba(30,64,175,0.07)' }}>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}><Icon name={item.i} size={16}/></div>
              <div style={{ fontSize: 36, fontFamily: "'Bebas Neue', cursive", color: '#1e3a8a' }}>{item.v}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>{item.l}</div>
            </div>
          ))}
        </div>
        {byPlanEntries.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: 15, boxShadow: '0 2px 10px rgba(30,64,175,0.07)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 11 }}>Por plan</div>
            {byPlanEntries.map(([name, count]) => {
              const pct = stats.total ? Math.round((count/stats.total)*100) : 0
              return (
                <div key={name} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{name}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8 }}>
                    <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#1e3a8a,#3b82f6)', width: `${pct}%` }}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {tagEntries.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: 15, boxShadow: '0 2px 10px rgba(30,64,175,0.07)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 9 }}>Material más usado</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {tagEntries.map(([tag, count]) => (
                <div key={tag} style={{ background: '#dbeafe', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>{tag}</span>
                  <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>×{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {stats.total === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 }}>¡Empieza a entrenar para ver stats!</div>}
      </div>
    )
  }

  // ─── SETTINGS ─────────────────────────────────────────────────────────────
  const SettingsScreen = () => {
    const [tokenInput, setTokenInput] = useState('')
    const [gistInput,  setGistInput]  = useState(creds?.gistId || '')
    const [connecting, setConnecting] = useState(false)
    const [connMsg, setConnMsg]       = useState('')

    async function connectGist() {
      if (!tokenInput.trim()) return
      setConnecting(true); setConnMsg('')
      const username = await verifyToken(tokenInput.trim())
      if (!username) { setConnMsg('❌ Token inválido'); setConnecting(false); return }

      let gistId = gistInput.trim()
      if (!gistId) {
        // Crear un Gist nuevo
        gistId = await createGist(tokenInput.trim(), state)
        if (!gistId) { setConnMsg('❌ Error creando Gist'); setConnecting(false); return }
        setConnMsg(`✅ Gist creado para @${username}`)
      } else {
        // Cargar el Gist existente
        const remote = await loadFromGist(tokenInput.trim(), gistId)
        if (remote) {
          setState(remote); saveLocal(remote)
          setConnMsg(`✅ Datos cargados de @${username}`)
        } else {
          setConnMsg(`✅ Gist conectado para @${username}`)
        }
      }
      const newCreds = { token: tokenInput.trim(), gistId, username }
      setCreds(newCreds); saveCreds(newCreds)
      setConnecting(false)
    }

    function disconnectGist() {
      setCreds(null); saveCreds(null); setConnMsg(''); setGistInput(''); setTokenInput('')
    }

    return (
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 24, fontFamily: "'Bebas Neue', cursive", letterSpacing: 2, color: '#0f172a' }}>Configuración</div>

        {/* Gist sync */}
        <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(30,64,175,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Icon name="cloud" size={18}/>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a' }}>Sincronización con GitHub Gist</span>
          </div>
          {creds?.username ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f0fdf4', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                <Icon name="ok" size={16}/><span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>Conectado como @{creds.username}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10, wordBreak: 'break-all' }}>Gist ID: {creds.gistId}</div>
              <button onClick={disconnectGist} style={{ width: '100%', padding: 10, borderRadius: 11, border: '1.5px solid #fca5a5', background: 'white', cursor: 'pointer', color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
                Desconectar Gist
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Necesitas un <strong>GitHub Personal Access Token</strong> con permiso <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>gist</code>.<br/>
                Ve a <strong>github.com → Settings → Developer settings → Personal access tokens</strong>
              </div>
              <input value={tokenInput} onChange={e => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                type="password"
                style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}/>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Si ya tienes un Gist de OlFit, pega su ID (opcional):</div>
              <input value={gistInput} onChange={e => setGistInput(e.target.value)}
                placeholder="ID del Gist existente (opcional)"
                style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}/>
              {connMsg && <div style={{ fontSize: 13, color: connMsg.startsWith('✅') ? '#15803d' : '#dc2626', fontWeight: 600 }}>{connMsg}</div>}
              <button onClick={connectGist} disabled={connecting}
                style={{ padding: '12px', borderRadius: 12, border: 'none', background: connecting ? '#94a3b8' : '#1e3a8a', color: 'white', fontWeight: 700, fontSize: 14, cursor: connecting ? 'default' : 'pointer' }}>
                {connecting ? 'Conectando...' : 'Conectar Gist'}
              </button>
            </div>
          )}
        </div>

        {/* Planes */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Planes</div>
        {state.plans.map(plan => (
          <div key={plan.id} style={{ background: 'white', borderRadius: 14, padding: '13px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(30,64,175,0.06)' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 14 }}>{plan.emoji} {plan.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{plan.routines} rutinas</div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={() => { setEditingPlan({ ...plan }); setModal('editPlan') }}
                style={{ background: '#dbeafe', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#1e40af' }}>
                <Icon name="edit" size={15}/>
              </button>
              {state.plans.length > 1 && (
                <button onClick={() => { if (window.confirm(`¿Borrar "${plan.name}"?`)) setState(s => ({ ...s, plans: s.plans.filter(p => p.id !== plan.id), activePlanId: s.activePlanId === plan.id ? s.plans[0].id : s.activePlanId })) }}
                  style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#dc2626' }}>
                  <Icon name="delete" size={15}/>
                </button>
              )}
            </div>
          </div>
        ))}
        <button onClick={() => { setNewPlanDraft({ emoji: '💪🏾', name: '', routines: 30 }); setModal('newPlan') }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 14, border: '2px dashed #bfdbfe', background: 'transparent', cursor: 'pointer', color: '#1e40af', fontWeight: 600, fontSize: 14 }}>
          <Icon name="add" size={17}/>Nuevo plan
        </button>
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 9 }}>Zona peligrosa</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => {
              if (window.confirm('¿Reiniciar estadísticas desde hoy? El historial y las notas se conservan, solo se resetean los contadores.'))
                setState(s => ({ ...s, statsFrom: today() }))
            }}
              style={{ width: '100%', padding: 10, borderRadius: 12, border: '1.5px solid #fed7aa', background: 'white', cursor: 'pointer', color: '#ea580c', fontWeight: 600, fontSize: 13 }}>
              🔄 Reiniciar estadísticas
            </button>
            {state.statsFrom && (
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                Stats desde {formatDate(state.statsFrom)} · <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }} onClick={() => setState(s => ({ ...s, statsFrom: null }))}>ver todo el historial</span>
              </div>
            )}
            <button onClick={() => {
              if (window.confirm('¿Borrar TODO el historial? Se eliminarán sesiones, favoritas y se reiniciarán los contadores.'))
                setState(s => ({ ...s, sessions: [], favorites: [], statsFrom: null, currentIndexByPlan: Object.fromEntries(s.plans.map(p => [p.id, p.routines - 1])) }))
            }}
              style={{ width: '100%', padding: 10, borderRadius: 12, border: '1.5px solid #fca5a5', background: 'white', cursor: 'pointer', color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
              🗑️ Borrar historial completo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── MODALES ──────────────────────────────────────────────────────────────
  const LogModal = () => {
    const [customTag, setCustomTag] = useState('')
    const routineNum = sessionDraft.routineOverride !== null ? sessionDraft.routineOverride : currentRoutine
    function toggleTag(t) { setSessionDraft(d => ({ ...d, tags: d.tags.includes(t) ? d.tags.filter(x => x !== t) : [...d.tags, t] })) }
    function addCustom() { const t = customTag.trim().toLowerCase(); if (t && !sessionDraft.tags.includes(t)) { toggleTag(t); setCustomTag('') } }
    return (
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontFamily: "'Bebas Neue', cursive", letterSpacing: 1, color: '#0f172a' }}>{activePlan.emoji} {activePlan.name} · R{routineNum}</div>
          <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icon name="close"/></button>
        </div>
        <button onClick={() => toggleFav(activePlan.id, routineNum)}
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            borderColor: isFav(activePlan.id, routineNum) ? '#f59e0b' : '#e2e8f0', background: isFav(activePlan.id, routineNum) ? '#fef3c7' : 'white', color: isFav(activePlan.id, routineNum) ? '#92400e' : '#64748b' }}>
          <Icon name="star" size={14}/>{isFav(activePlan.id, routineNum) ? 'Favorita ★' : 'Marcar favorita'}
        </button>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Material</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESET_TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)} style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                borderColor: sessionDraft.tags.includes(t) ? '#1e3a8a' : '#e2e8f0', background: sessionDraft.tags.includes(t) ? '#1e3a8a' : 'white', color: sessionDraft.tags.includes(t) ? 'white' : '#64748b' }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
            <input value={customTag} onChange={e => setCustomTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()} placeholder="Otro material..."
              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}/>
            <button onClick={addCustom} style={{ padding: '8px 11px', borderRadius: 10, border: 'none', background: '#1e3a8a', color: 'white', cursor: 'pointer' }}><Icon name="add" size={15}/></button>
          </div>
          {sessionDraft.tags.filter(t => !PRESET_TAGS.includes(t)).map(t => (
            <span key={t} style={{ display: 'inline-block', margin: '4px 4px 0 0', background: '#f0f9ff', color: '#0369a1', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              {t} <span style={{ cursor: 'pointer' }} onClick={() => toggleTag(t)}>×</span>
            </span>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 }}>Nota</div>
          <textarea value={sessionDraft.note} onChange={e => setSessionDraft(d => ({ ...d, note: e.target.value }))} placeholder="Cómo fue, sensaciones..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'none', outline: 'none', height: 65, boxSizing: 'border-box' }}/>
        </div>
        <button onClick={logSession} style={{ padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          ¡Completada! →
        </button>
      </div>
    )
  }

  const SkipModal = () => {
    const [search, setSearch] = useState('')
    const routines = Array.from({ length: activePlan.routines }, (_, i) => i).reverse()
    const filtered = search ? routines.filter(i => String(i + 1).includes(search)) : routines
    return (
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontFamily: "'Bebas Neue', cursive", letterSpacing: 1, color: '#0f172a' }}>Ir a rutina · {activePlan.emoji} {activePlan.name}</div>
          <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icon name="close"/></button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar número..."
          style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' }}/>
        <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {filtered.slice(0, 60).map(i => (
            <button key={i} onClick={() => { setCurrentIndex(activePlan.id, i); setModal(null) }}
              style={{ padding: '10px 14px', borderRadius: 11, border: '1.5px solid', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600,
                borderColor: currentIndex === i ? '#1e3a8a' : '#e2e8f0', background: currentIndex === i ? '#dbeafe' : 'white', color: currentIndex === i ? '#1e3a8a' : '#334155',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Rutina {i + 1}
              <span style={{ display: 'flex', gap: 5 }}>
                {isFav(activePlan.id, i + 1) && <span style={{ color: '#f59e0b' }}>★</span>}
                {currentIndex === i && <span style={{ fontSize: 10, color: '#1e40af' }}>← actual</span>}
              </span>
            </button>
          ))}
          {filtered.length > 60 && <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', padding: 6 }}>Filtra para ver más resultados</div>}
        </div>
      </div>
    )
  }

  const EditPlanModal = () => (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontFamily: "'Bebas Neue', cursive", letterSpacing: 1, color: '#0f172a' }}>Editar plan</div>
        <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icon name="close"/></button>
      </div>
      {[['Emoji', 'emoji', '22px', 'text'], ['Nombre', 'name', '14px', 'text']].map(([label, field, fs, type]) => (
        <div key={field}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
          <input value={editingPlan[field]} onChange={e => setEditingPlan(p => ({ ...p, [field]: e.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: 5, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: fs, outline: 'none', boxSizing: 'border-box' }}/>
        </div>
      ))}
      <div>
        <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Número de rutinas</label>
        <input type="number" min={1} max={999} value={editingPlan.routines}
          onChange={e => setEditingPlan(p => ({ ...p, routines: Math.max(1, Math.min(999, Number(e.target.value))) }))}
          style={{ display: 'block', width: '100%', marginTop: 5, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 22, fontWeight: 700, outline: 'none', boxSizing: 'border-box', color: '#1e3a8a' }}/>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Máximo 999 rutinas por plan</div>
      </div>
      <button onClick={() => { setState(s => ({ ...s, plans: s.plans.map(p => p.id === editingPlan.id ? editingPlan : p) })); setModal(null) }}
        style={{ padding: 14, borderRadius: 14, border: 'none', background: '#1e3a8a', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        Guardar cambios
      </button>
    </div>
  )

  const NewPlanModal = () => (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontFamily: "'Bebas Neue', cursive", letterSpacing: 1, color: '#0f172a' }}>Nuevo plan</div>
        <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icon name="close"/></button>
      </div>
      {[['Emoji', 'emoji', '22px'], ['Nombre', 'name', '14px']].map(([label, field, fs]) => (
        <div key={field}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
          <input value={newPlanDraft[field]} onChange={e => setNewPlanDraft(p => ({ ...p, [field]: e.target.value }))} placeholder={field === 'name' ? 'Nombre del plan' : ''}
            style={{ display: 'block', width: '100%', marginTop: 5, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: fs, outline: 'none', boxSizing: 'border-box' }}/>
        </div>
      ))}
      <div>
        <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Número de rutinas</label>
        <input type="number" min={1} max={999} value={newPlanDraft.routines}
          onChange={e => setNewPlanDraft(p => ({ ...p, routines: Math.max(1, Math.min(999, Number(e.target.value))) }))}
          style={{ display: 'block', width: '100%', marginTop: 5, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 22, fontWeight: 700, outline: 'none', boxSizing: 'border-box', color: '#1e3a8a' }}/>
      </div>
      <button onClick={() => {
        if (!newPlanDraft.name.trim()) return
        const np = { id: `plan-${Date.now()}`, emoji: newPlanDraft.emoji, name: newPlanDraft.name.trim(), routines: newPlanDraft.routines }
        setState(s => ({ ...s, plans: [...s.plans, np], currentIndexByPlan: { ...s.currentIndexByPlan, [np.id]: np.routines - 1 } }))
        setModal(null)
      }} style={{ padding: 14, borderRadius: 14, border: 'none', background: '#1e3a8a', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        Crear plan
      </button>
    </div>
  )

  const activeModal = modal && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#f0f6ff', borderRadius: '24px 24px 0 0', maxHeight: '88vh', overflowY: 'auto', animation: 'slideUp .22s ease' }}>
        {modal === 'log'      && <LogModal/>}
        {modal === 'skip'     && <SkipModal/>}
        {modal === 'editPlan' && editingPlan && <EditPlanModal/>}
        {modal === 'newPlan'  && <NewPlanModal/>}
      </div>
    </div>
  )

  const screens = { home: <HomeScreen/>, history: <HistoryScreen/>, stats: <StatsScreen/>, settings: <SettingsScreen/> }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;font-family:'DM Sans',sans-serif;}
        html,body,#root{height:100%;background:#e8f0fe;}
        body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        input[type=number]{-moz-appearance:textfield;}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#bfdbfe;border-radius:4px}
      `}</style>
      <div style={{ background: '#e8f0fe', minHeight: '100%', maxWidth: 480, margin: '0 auto', paddingBottom: 'calc(70px + env(safe-area-inset-bottom))' }}>
        {screens[screen]}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480,
          background: 'white', borderTop: '1.5px solid #e2e8f0',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
          paddingTop: 8, paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
          {[{ id: 'home', icon: 'home', label: 'Inicio' }, { id: 'history', icon: 'history', label: 'Historial' }, { id: 'stats', icon: 'stats', label: 'Stats' }, { id: 'settings', icon: 'settings', label: 'Config' }].map(tab => (
            <button key={tab.id} onClick={() => setScreen(tab.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: screen === tab.id ? '#1e3a8a' : '#94a3b8', transition: 'color .15s' }}>
              <Icon name={tab.icon} size={22}/>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {activeModal}
    </>
  )
}
