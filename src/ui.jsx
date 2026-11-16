import { useEffect } from 'react'
import { X, Dumbbell, Footprints, Activity, ArrowUp, ArrowDown, Flame } from 'lucide-react'
import { ZONE_COLOR } from './data'

export const cx = (...a) => a.filter(Boolean).join(' ')

export function Button({ children, variant = 'primary', className, ...p }) {
  const v = {
    primary: 'bg-neon text-black font-extrabold',
    secondary: 'bg-surface2 text-white font-bold border border-line',
    danger: 'bg-red-600/90 text-white font-bold',
    ghost: 'text-neon font-bold',
  }[variant]
  return (
    <button {...p} className={cx('min-h-14 px-5 rounded-2xl text-lg flex items-center justify-center gap-2 disabled:opacity-40 transition-transform', v, className)}>
      {children}
    </button>
  )
}

export function Chip({ active, color, children, ...p }) {
  return (
    <button {...p} className={cx('min-h-11 px-4 rounded-full text-base font-semibold whitespace-nowrap border transition-colors', active ? 'text-black border-transparent' : 'bg-surface text-white border-line')}
      style={active ? { background: color || 'var(--color-neon)' } : undefined}>
      {children}
    </button>
  )
}

export function ZoneDot({ zone, size = 10 }) {
  return <span className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: ZONE_COLOR[zone] || '#888' }} />
}

export function Card({ children, className, ...p }) {
  return <div {...p} className={cx('bg-surface border border-line rounded-3xl p-4', className)}>{children}</div>
}

export function Header({ title, subtitle, right }) {
  return (
    <div className="safe-top sticky top-0 z-20 bg-bg/95 backdrop-blur px-4 pt-4 pb-3 flex items-end justify-between">
      <div>
        {subtitle && <div className="text-muted text-sm font-medium first-letter:uppercase">{subtitle}</div>}
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      </div>
      {right}
    </div>
  )
}

// Hoja inferior a pantalla casi completa
export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative slide-up bg-bg border-t border-line rounded-t-3xl max-h-[92%] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-2xl font-black">{title}</h2>
          <button aria-label="Cerrar" onClick={onClose} className="size-12 rounded-full bg-surface2 flex items-center justify-center"><X size={24} /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-4 flex-1">{children}</div>
        {footer && <div className="px-5 pt-3 pb-4 safe-bottom border-t border-line">{footer}</div>}
      </div>
    </div>
  )
}

export const Field = ({ label, children }) => (
  <label className="block mb-4">
    <span className="block text-sm font-semibold text-muted mb-1.5">{label}</span>
    {children}
  </label>
)
export const inputCls = 'w-full min-h-14 rounded-2xl bg-surface border border-line px-4 text-lg text-white placeholder-muted focus:outline-none focus:border-neon'

// Ilustración de ejercicio: foto del usuario o placeholder SVG limpio por zona
const ZONE_ICON = { Pecho: Dumbbell, Espalda: ArrowDown, Piernas: Footprints, Hombros: ArrowUp, Brazos: Dumbbell, Abdomen: Flame, Cardio: Activity }
export function ExerciseImage({ ex, className = '', rounded = 'rounded-2xl' }) {
  if (ex.img) return <img src={ex.img} alt={ex.name} className={cx('object-cover', rounded, className)} />
  const color = ZONE_COLOR[ex.zone] || '#888'
  const Icon = ZONE_ICON[ex.zone] || Dumbbell
  return (
    <div className={cx('flex flex-col items-center justify-center relative overflow-hidden', rounded, className)}
      style={{ background: `radial-gradient(circle at 30% 20%, ${color}33, #141414 70%)`, border: `1px solid ${color}44` }}>
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><pattern id={'g' + ex.zone} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke={color} strokeWidth=".4" /></pattern></defs>
        <rect width="100" height="100" fill={`url(#g${ex.zone})`} />
      </svg>
      <Icon size={36} color={color} strokeWidth={2.2} className="relative" />
    </div>
  )
}

export function Empty({ icon: Icon, text }) {
  return (
    <div className="text-center text-muted py-12">
      {Icon && <Icon size={44} className="mx-auto mb-3 opacity-60" />}
      <p className="text-lg">{text}</p>
    </div>
  )
}
