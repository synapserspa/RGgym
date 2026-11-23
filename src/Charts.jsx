// Gráfico de línea simple (SVG) para evolución en el tiempo.
export function LineChart({ points, color = '#39ff14', unit = '', decimals = 1, height = 130 }) {
  const pts = points.filter((p) => Number.isFinite(p.y))
  if (pts.length < 2) return <p className="text-sm text-muted py-4 text-center">Necesitas al menos 2 registros para ver el gráfico.</p>
  const W = 320, H = height, padX = 8, padT = 16, padB = 22
  const ys = pts.map((p) => p.y); let min = Math.min(...ys); let max = Math.max(...ys)
  if (max - min < 0.001) { min -= 1; max += 1 }
  const span = max - min; min -= span * 0.1; max += span * 0.1
  const x = (i) => padX + (i * (W - 2 * padX)) / (pts.length - 1)
  const y = (v) => padT + ((max - v) / (max - min)) * (H - padT - padB)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.y).toFixed(1)}`).join(' ')
  const f = (v) => v.toLocaleString('es-ES', { maximumFractionDigits: decimals })
  const last = pts[pts.length - 1]; const first = pts[0]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de evolución">
      <path d={`${d} L${x(pts.length - 1)} ${H - padB} L${x(0)} ${H - padB} Z`} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.y)} r={i === pts.length - 1 ? 4.5 : 2.5} fill={color} />)}
      <text x={x(pts.length - 1)} y={y(last.y) - 8} textAnchor="end" fontSize="11" fontWeight="800" fill="#fff">{f(last.y)}{unit}</text>
      <text x={padX} y={H - 6} fontSize="9" fill="#9aa3b5">{first.x}</text>
      <text x={W - padX} y={H - 6} textAnchor="end" fontSize="9" fill="#9aa3b5">{last.x}</text>
    </svg>
  )
}
