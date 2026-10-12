import { useState } from 'react'
import { brl, data as fdata } from './util'

interface Serie { nome: string; cor: string; pontos: { x: string; y: number }[]; tracejada?: boolean }

/** Gráfico de linhas simples em SVG (sem biblioteca). Toque/arraste mostra o valor do dia. */
export function Linhas({ series, altura = 180, formato = brl, marcas = [] }: {
  series: Serie[]; altura?: number; formato?: (n: number) => string; marcas?: { x: string; y: number }[]
}) {
  const [sel, setSel] = useState<number | null>(null)
  const base = series[0]?.pontos ?? []
  if (base.length < 2) return <div className="suave">Sem dados suficientes para o gráfico.</div>
  const W = 340
  const H = altura
  const pad = { t: 8, b: 20, l: 4, r: 4 }
  const todos = series.flatMap((s) => s.pontos.map((p) => p.y)).concat(marcas.map((m) => m.y))
  const min = Math.min(...todos)
  const max = Math.max(...todos)
  const folga = (max - min || 1) * 0.08
  const lo = min - folga
  const hi = max + folga
  const idx = (x: string): number => {
    const i = base.findIndex((p) => p.x >= x)
    return i === -1 ? base.length - 1 : i
  }
  const X = (i: number): number => pad.l + (i / (base.length - 1)) * (W - pad.l - pad.r)
  const Y = (v: number): number => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b)
  const caminho = (s: Serie): string =>
    s.pontos.map((p, k) => {
      const i = Math.min(base.length - 1, idx(p.x))
      return `${k === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`
    }).join(' ')

  function tocar(e: React.PointerEvent<SVGSVGElement>): void {
    const r = e.currentTarget.getBoundingClientRect()
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    setSel(Math.round(f * (base.length - 1)))
  }
  const ponto = sel === null ? null : base[sel]
  return (
    <div className="grafico">
      <div className="grafico-legenda">
        {series.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome}</span>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" onPointerDown={tocar} onPointerMove={(e) => e.buttons > 0 || e.pointerType === 'touch' ? tocar(e) : undefined} onPointerLeave={() => setSel(null)} style={{ touchAction: 'pan-y' }}>
        {[0, 0.5, 1].map((f) => <line key={f} x1={0} x2={W} y1={Y(lo + (hi - lo) * f)} y2={Y(lo + (hi - lo) * f)} stroke="var(--borda)" strokeWidth="1" />)}
        {series.map((s) => <path key={s.nome} d={caminho(s)} fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" strokeDasharray={s.tracejada ? '5 4' : undefined} />)}
        {marcas.map((m, k) => <circle key={k} cx={X(Math.min(base.length - 1, idx(m.x)))} cy={Y(m.y)} r="3.5" fill="#fff" stroke="var(--fundo)" strokeWidth="1.5" />)}
        {sel !== null && <line x1={X(sel)} x2={X(sel)} y1={pad.t} y2={H - pad.b} stroke="var(--texto-2)" strokeDasharray="3 3" />}
        <text x={pad.l} y={H - 4} fill="var(--texto-2)" fontSize="10">{fdata(base[0].x)}</text>
        <text x={W - pad.r} y={H - 4} fill="var(--texto-2)" fontSize="10" textAnchor="end">{fdata(base[base.length - 1].x)}</text>
      </svg>
      {ponto && (
        <div className="grafico-dica">
          <b>{fdata(ponto.x)}</b>
          {series.map((s) => {
            const p = s.pontos.find((q) => q.x === ponto.x) ?? s.pontos[Math.min(s.pontos.length - 1, sel ?? 0)]
            return <span key={s.nome}><i style={{ background: s.cor }} />{formato(p.y)}</span>
          })}
        </div>
      )}
    </div>
  )
}

/** Barras horizontais (participação por classe). */
export function BarrasPct({ itens }: { itens: { nome: string; valor: number; cor: string; texto: string }[] }) {
  return (
    <div className="barras-pct">
      {itens.map((i) => (
        <div key={i.nome} className="barra-pct">
          <div className="linha-topo"><span>{i.nome}</span><b>{i.texto}</b></div>
          <div className="trilha"><i style={{ width: Math.max(2, i.valor * 100) + '%', background: i.cor }} /></div>
        </div>
      ))}
    </div>
  )
}

/** Barras verticais por mês (proventos). */
export function BarrasMes({ itens }: { itens: { rotulo: string; recebido: number; aReceber: number }[] }) {
  const max = Math.max(...itens.map((i) => i.recebido + i.aReceber), 0.01)
  return (
    <div className="barras-mes">
      {itens.map((i) => (
        <div key={i.rotulo} className="coluna">
          <div className="pilha">
            <i className="a-receber" style={{ height: (i.aReceber / max) * 100 + '%' }} />
            <i className="recebido" style={{ height: (i.recebido / max) * 100 + '%' }} />
          </div>
          <small>{i.rotulo}</small>
        </div>
      ))}
    </div>
  )
}
