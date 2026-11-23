import { useEffect, useState } from 'react'
import { BarChart3, CalendarDays, Dumbbell, Library as LibIcon, PersonStanding } from 'lucide-react'
import { downloadBackup, initBackNav, useBackLayer, useStore } from './lib'
import { useAccess } from './access'
import { CoachDialog } from './coach'
import { cx } from './ui'
import Today from './Today'
import { ActiveWorkout } from './Active'
import Calendar from './Calendar'
import Library from './Library'
import Progress from './Progress'
import Calisthenics from './Calisthenics'

const TABS = [
  { id: 'today', label: 'Entrenar', icon: Dumbbell },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'library', label: 'Ejercicios', icon: LibIcon },
  { id: 'cali', label: 'Calistenia', icon: PersonStanding },
  { id: 'progress', label: 'Progreso', icon: BarChart3 },
]

function LockScreen({ msg, kind, checking, onRetry, onBackup }) {
  const [info, setInfo] = useState('')
  const retry = async () => {
    setInfo('Verificando…')
    const r = await onRetry()
    setInfo(r === 'sin-conexion' ? 'Sin conexión: no se pudo verificar.' : r === 'suspendida' ? 'El acceso sigue suspendido.' : '')
  }
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-xl mx-auto safe-top safe-bottom">
      <img src="./icons/icon-192.png" alt="" className="size-24 rounded-3xl mb-6 opacity-60" />
      <div className="text-5xl mb-3">🔒</div>
      <h1 className="text-2xl font-black leading-tight mb-2">{msg}</h1>
      {checking && <p className="text-neon font-semibold mb-3">Verificando acceso…</p>}
      {kind === 'expired' && <p className="text-muted mb-4">Con internet, toca Reintentar.</p>}
      <p className="text-muted text-sm mb-8">Tus datos siguen guardados en este dispositivo. Puedes descargar tu copia de seguridad.</p>
      <button onClick={onBackup} className="w-full min-h-16 rounded-2xl bg-neon text-black text-lg font-black">Descargar mi copia de seguridad</button>
      {kind !== 'unauthorized' && <button onClick={retry} disabled={checking} className="w-full min-h-14 mt-3 rounded-2xl bg-surface2 border border-line text-lg font-bold disabled:opacity-50">Reintentar</button>}
      {info && <p className="mt-3 text-sm text-muted">{info}</p>}
    </div>
  )
}

function Welcome({ onDone }) {
  const [name, setName] = useState('')
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-xl mx-auto safe-top safe-bottom">
      <img src="./icons/icon-192.png" alt="" className="size-28 rounded-3xl mb-6" />
      <h1 className="text-4xl font-black leading-tight">De flaco<br /><span className="text-neon">a definido.</span></h1>
      <p className="text-muted mt-3 mb-8">Tu sistema de entrenamiento Metodo Rod: 4 días, ~1 hora, todo registrado y sin necesidad de internet.</p>
      <input className="w-full min-h-14 rounded-2xl bg-surface border border-line px-4 text-lg text-center focus:outline-none focus:border-neon" placeholder="¿Cómo te llamas?" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => onDone(name)} className="w-full min-h-16 mt-4 rounded-2xl bg-neon text-black text-xl font-black">Empezar</button>
    </div>
  )
}

function Shell({ settings, children }) {
  const has = !!settings.bg
  return (
    <div className={has ? 'has-bg h-full' : 'h-full'}>
      {has && <>
        <div className="bg-layer" style={{ backgroundImage: `url(${settings.bg})` }} />
        <div className="bg-layer" style={{ background: `rgba(10,10,10,${settings.bgDim ?? 0.75})` }} />
      </>}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function AppInner() {
  const { state, update, replaceAll, saveError } = useStore()
  const access = useAccess()
  const [tab, setTab] = useState('today')
  const [toast, setToast] = useState(false)
  useEffect(() => { initBackNav(() => { setToast(true); setTimeout(() => setToast(false), 2000) }) }, [])
  useBackLayer(tab !== 'today' && !state.active, () => setTab('today')) // atrás desde otra pestaña vuelve a "Entrenar"

  if (access.locked) return <LockScreen msg={access.msg} kind={access.kind} checking={access.checking} onRetry={access.recheck} onBackup={() => downloadBackup(state)} />
  if (!state.settings.welcomed) return <Welcome onDone={(name) => update((s) => ({ ...s, settings: { ...s.settings, name: name.trim(), welcomed: true } }))} />
  if (state.active) return <Shell settings={state.settings}><ActiveWorkout state={state} update={update} onExit={() => setTab('progress')} /></Shell>

  return (
    <Shell settings={state.settings}>
    <div className="h-full flex flex-col max-w-xl mx-auto">
      <main className="flex-1 overflow-y-auto pb-28">
        {tab === 'today' && <Today state={state} update={update} onStartTraining={() => {}} />}
        {tab === 'calendar' && <Calendar state={state} update={update} onStart={() => setTab('today')} />}
        {tab === 'library' && <Library state={state} update={update} />}
        {tab === 'cali' && <Calisthenics state={state} update={update} onToday={() => setTab('today')} />}
        {tab === 'progress' && <Progress state={state} update={update} replaceAll={replaceAll} saveError={saveError} />}
      </main>
      {toast && <div className="fixed bottom-24 inset-x-0 z-50 flex justify-center pointer-events-none"><div className="bg-surface2 border border-line rounded-full px-5 py-3 font-semibold shadow-lg">Presiona atrás otra vez para salir</div></div>}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur border-t border-line safe-bottom">
        <div className="max-w-xl mx-auto grid grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id} className={cx('min-h-[68px] flex flex-col items-center justify-center gap-1 text-xs font-bold', tab === id ? 'text-neon' : 'text-muted')}>
              <Icon size={26} strokeWidth={tab === id ? 2.8 : 2} />{label}
            </button>
          ))}
        </div>
      </nav>
    </div>
    </Shell>
  )
}

export default function App() {
  return (
    <>
      <AppInner />
      <CoachDialog />
    </>
  )
}
