import { C } from '../../tokens'

interface YKey {
  key: string
  stroke?: string
  strokeWidth?: number
  dash?: string
  fill?: string
}

interface Props {
  data: Record<string, number>[]
  w: number
  h: number
  xKey: string
  yKeys: YKey[]
  pad?: { t: number; r: number; b: number; l: number }
  showGrid?: boolean
}

export function LineChart({ data, w, h, xKey, yKeys, pad = { t: 16, r: 16, b: 22, l: 40 }, showGrid = true }: Props) {
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const xs = data.map(d => d[xKey])
  const ys = yKeys.flatMap(k => data.map(d => d[k.key]))
  const xmin = Math.min(...xs), xmax = Math.max(...xs)
  let ymin = Math.min(...ys), ymax = Math.max(...ys)
  const py = (ymax - ymin) * 0.1; ymin -= py; ymax += py
  const sx = (v: number) => pad.l + ((v - xmin) / (xmax - xmin || 1)) * iw
  const sy = (v: number) => pad.t + ih - ((v - ymin) / (ymax - ymin || 1)) * ih
  const ticks = 4

  return (
    <svg width={w} height={h} style={{ display: 'block', fontFamily: C.mono }}>
      {showGrid && Array.from({ length: ticks + 1 }, (_, i) => {
        const v = ymin + (i / ticks) * (ymax - ymin)
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)}
              stroke={C.ruleS} strokeWidth="1"
              strokeDasharray={i === 0 || i === ticks ? '0' : '2 3'} />
            <text x={pad.l - 6} y={sy(v) + 3} fontSize="9" fill={C.ink3} textAnchor="end">
              {Math.round(v).toLocaleString()}
            </text>
          </g>
        )
      })}
      {data.length > 6 && [0, 6, 12, 18].map(hr => {
        const idx = data.findIndex(d => Math.abs(d.hour - hr) < 0.2)
        if (idx < 0) return null
        return (
          <text key={hr} x={sx(data[idx][xKey])} y={h - 6} fontSize="9" fill={C.ink3} textAnchor="middle">
            {String(hr).padStart(2, '0')}:00
          </text>
        )
      })}
      {yKeys.map(k => {
        const pts = data.map(d => `${sx(d[xKey]).toFixed(1)},${sy(d[k.key]).toFixed(1)}`).join(' ')
        return (
          <g key={k.key}>
            {k.fill && (
              <polygon
                points={`${sx(xmin)},${sy(ymin)} ${pts} ${sx(xmax)},${sy(ymin)}`}
                fill={k.fill} />
            )}
            <polyline points={pts} fill="none"
              stroke={k.stroke ?? C.ink}
              strokeWidth={k.strokeWidth ?? 1.2}
              strokeDasharray={k.dash ?? '0'} />
          </g>
        )
      })}
    </svg>
  )
}
