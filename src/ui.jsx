import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useBackLayer } from './lib'
import { figureSVG } from './figs-core'
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
  useBackLayer(open, onClose)
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
      <div className="relative slide-up bg-[#0a0a0a] border-t border-line rounded-t-3xl max-h-[92%] flex flex-col">
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

// Ilustración del ejercicio: foto del usuario o dibujo esquemático (inicio → final) según el ejercicio
export function ExerciseImage({ ex, className = '', rounded = 'rounded-2xl', compact = false }) {
  if (ex.img) return <img src={ex.img} alt={ex.name} className={cx('object-cover', rounded, className)} />
  const color = ZONE_COLOR[ex.zone] || '#c6f432'
  const svg = figureSVG(ex.id, ex.zone, color, compact)
  return (
    <div role="img" aria-label={`Dibujo del ejercicio ${ex.name}`} className={cx('flex items-center justify-center relative overflow-hidden p-1.5', rounded, className)}
      style={{ background: `radial-gradient(circle at 30% 20%, ${color}26, #11161d 70%)`, border: `1px solid ${color}44` }}
      dangerouslySetInnerHTML={{ __html: svg }} />
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
