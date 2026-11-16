import { useState } from 'react'
import { BarChart3, CalendarDays, Dumbbell, Library as LibIcon } from 'lucide-react'
import { useStore } from './lib'
import { cx } from './ui'
import Today, { ActiveWorkout } from './Today'
import Calendar from './Calendar'
import Library from './Library'
import Progress from './Progress'

const TABS = [
  { id: 'today', label: 'Entrenar', icon: Dumbbell },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'library', label: 'Ejercicios', icon: LibIcon },
  { id: 'progress', label: 'Progreso', icon: BarChart3 },
]

function Welcome({ onDone }) {
  const [name, setName] = useState('')
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-xl mx-auto safe-top safe-bottom">
      <img src="./icons/icon-192.png" alt="" className="size-28 rounded-3xl mb-6" />
      <h1 className="text-4xl font-black leading-tight">De flaco<br /><span className="text-neon">a definido.</span></h1>
      <p className="text-muted mt-3 mb-8">Tu sistema de entrenamiento Método H: 4 días, ~1 hora, todo registrado y sin necesidad de internet.</p>
      <input className="w-full min-h-14 rounded-2xl bg-surface border border-line px-4 text-lg text-center focus:outline-none focus:border-neon" placeholder="¿Cómo te llamas?" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => onDone(name)} className="w-full min-h-16 mt-4 rounded-2xl bg-neon text-black text-xl font-black">Empezar</button>
    </div>
  )
}

export default function App() {
  const { state, update, replaceAll, saveError } = useStore()
  const [tab, setTab] = useState('today')

  if (!state.settings.welcomed) return <Welcome onDone={(name) => update((s) => ({ ...s, settings: { ...s.settings, name: name.trim(), welcomed: true } }))} />
  if (state.active) return <ActiveWorkout state={state} update={update} onExit={() => setTab('progress')} />

  return (
    <div className="h-full flex flex-col max-w-xl mx-auto">
      <main className="flex-1 overflow-y-auto pb-28">
        {tab === 'today' && <Today state={state} update={update} onStartTraining={() => {}} />}
        {tab === 'calendar' && <Calendar state={state} update={update} onStart={() => setTab('today')} />}
        {tab === 'library' && <Library state={state} update={update} />}
        {tab === 'progress' && <Progress state={state} update={update} replaceAll={replaceAll} saveError={saveError} />}
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur border-t border-line safe-bottom">
        <div className="max-w-xl mx-auto grid grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id} className={cx('min-h-[68px] flex flex-col items-center justify-center gap-1 text-xs font-bold', tab === id ? 'text-neon' : 'text-muted')}>
              <Icon size={26} strokeWidth={tab === id ? 2.8 : 2} />{label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
