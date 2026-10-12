import { useRef, useState } from 'react'
import type { ResultadoIntervalo } from './tipos'
import { brl, corDe, data as fdata, pct, sinalBRL } from './util'

interface Serie { nome: string; cor: string; pontos: { x: string; y: number }[]; tracejada?: boolean }

/**
 * Gráfico de linhas em SVG (sem biblioteca).
 * Toque num ponto e ARRASTE até outro: mostra quanto subiu ou desceu entre os dois (igual ao computador).
 * `calcular(inicio, fim)` devolve a conta (patrimônio sem contar aportes, ou variação do preço).
 */
export function Linhas({ series, altura = 190, formato = brl, marcas = [], calcular }: {
  series: Serie[]; altura?: number; formato?: (n: number) => string; marcas?: { x: string; y: number }[]
  calcular?: (inicio: string, fim: string) => ResultadoIntervalo | null
}) {
  const [sel, setSel] = useState<{ i1: number; i2: number | null } | null>(null)
  const arrastando = useRef(false)
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
    s.pontos.map((p, k) => `${k === 0 ? 'M' : 'L'}${X(Math.min(base.length - 1, idx(p.x))).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')

  const indiceDe = (e: React.PointerEvent<SVGSVGElement>): number => {
    const r = e.currentTarget.getBoundingClientRect()
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    return Math.round(f * (base.length - 1))
  }
  function aoTocar(e: React.PointerEvent<SVGSVGElement>): void {
    arrastando.current = true
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sem captura: segue dentro do gráfico */ }
    setSel({ i1: indiceDe(e), i2: null })
  }
  function aoMover(e: React.PointerEvent<SVGSVGElement>): void {
    if (!arrastando.current) return
    const i = indiceDe(e)   // calculado antes: o evento do React não vale mais dentro do setSel
    setSel((s) => (s ? { ...s, i2: i } : s))
  }
  function aoSoltar(): void {
    arrastando.current = false
    setSel((s) => (s && (s.i2 === null || s.i2 === s.i1) ? null : s))   // um toque simples (sem arrastar) não seleciona nada
  }

  const a = sel ? Math.min(sel.i1, sel.i2 ?? sel.i1) : 0
  const b = sel ? Math.max(sel.i1, sel.i2 ?? sel.i1) : 0
  const r: ResultadoIntervalo | null = sel && sel.i2 !== null && sel.i2 !== sel.i1 && calcular ? calcular(base[a].x, base[b].x) : null
  const ponto = sel ? base[sel.i2 ?? sel.i1] : null

  return (
    <div className="grafico">
      <div className="grafico-legenda">
        {series.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome}</span>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" onPointerDown={aoTocar} onPointerMove={aoMover} onPointerUp={aoSoltar} onPointerCancel={aoSoltar} style={{ touchAction: 'pan-y', userSelect: 'none' }}>
        {[0, 0.5, 1].map((f) => <line key={f} x1={0} x2={W} y1={Y(lo + (hi - lo) * f)} y2={Y(lo + (hi - lo) * f)} stroke="var(--borda)" strokeWidth="1" />)}
        {sel && sel.i2 !== null && sel.i2 !== sel.i1 && <rect x={X(a)} y={pad.t} width={X(b) - X(a)} height={H - pad.t - pad.b} fill="rgba(108,108,255,.16)" />}
        {series.map((s) => <path key={s.nome} d={caminho(s)} fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" strokeDasharray={s.tracejada ? '5 4' : undefined} />)}
        {marcas.map((m, k) => <circle key={k} cx={X(Math.min(base.length - 1, idx(m.x)))} cy={Y(m.y)} r="3.5" fill="#fff" stroke="var(--fundo)" strokeWidth="1.5" />)}
        {sel && <line x1={X(sel.i1)} x2={X(sel.i1)} y1={pad.t} y2={H - pad.b} stroke="var(--texto)" strokeWidth="1.5" />}
        {sel && sel.i2 !== null && <line x1={X(sel.i2)} x2={X(sel.i2)} y1={pad.t} y2={H - pad.b} stroke="var(--texto)" strokeWidth="1.5" />}
        <text x={pad.l} y={H - 4} fill="var(--texto-2)" fontSize="10">{fdata(base[0].x)}</text>
        <text x={W - pad.r} y={H - 4} fill="var(--texto-2)" fontSize="10" textAnchor="end">{fdata(base[base.length - 1].x)}</text>
      </svg>

      {!sel && calcular && <div className="grafico-dica-uso">Toque num ponto e arraste até outro para ver a valorização.</div>}
      {sel && ponto && !r && (
        <div className="grafico-dica">
          <b>{fdata(ponto.x)}</b>
          {series.map((s) => {
            const p = s.pontos.find((q) => q.x === ponto.x) ?? s.pontos[Math.min(s.pontos.length - 1, sel.i2 ?? sel.i1)]
            return <span key={s.nome}><i style={{ background: s.cor }} />{formato(p.y)}</span>
          })}
        </div>
      )}
      {r && (
        <div className="caixa-intervalo">
          <div className="int-datas">{fdata(r.inicio)} – {fdata(r.fim)}</div>
          <div className="int-valores">{formato(r.valor_inicio)} → {formato(r.valor_fim)}</div>
          <div className={`int-pct ${corDe(r.pct)}`}>{r.pct === null ? '–' : pct(r.pct, true)}</div>
          <div className={`int-dif ${corDe(r.diferenca)}`}>{r.diferenca > 0 ? '+' : r.diferenca < 0 ? '−' : ''}{formato(Math.abs(r.diferenca))}</div>
          {!!r.compras && <div className="int-nota">sem contar {brl(r.compras)} de compras</div>}
          {!!r.vendas && <div className="int-nota">sem contar {brl(r.vendas)} de vendas</div>}
          {r.estimado && <div className="int-nota">inclui preço estimado</div>}
          <button className="int-limpar" onClick={() => setSel(null)}>Limpar seleção</button>
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

export { sinalBRL }
