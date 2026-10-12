import { useRef, useState } from 'react'
import type { ResultadoIntervalo } from './tipos'
import { brl, corDe, data as fdata, pct, sinalBRL } from './util'

interface Serie { nome: string; cor: string; pontos: { x: string; y: number }[]; tracejada?: boolean }

type Modo = { tipo: 'novo'; ancora: number } | { tipo: 'borda'; lado: 'a' | 'b' }

/**
 * Gráfico de linhas em SVG (sem biblioteca).
 * Toque num ponto e ARRASTE até outro: marca o período e mostra, na caixa fixa de baixo, quanto subiu ou desceu.
 * Depois, puxe as bordas (as alças nas laterais da faixa) para aumentar ou diminuir o período, igual ao computador.
 * `calcular(inicio, fim)` devolve a conta (patrimônio sem contar aportes, ou variação do preço).
 */
export function Linhas({ series, altura = 190, formato = brl, marcas = [], calcular }: {
  series: Serie[]; altura?: number; formato?: (n: number) => string; marcas?: { x: string; y: number }[]
  calcular?: (inicio: string, fim: string) => ResultadoIntervalo | null
}) {
  const [sel, setSel] = useState<{ a: number; b: number } | null>(null)
  const modo = useRef<Modo | null>(null)
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
  /** Distância (em pixels da tela) entre o dedo e uma borda da faixa. */
  const distanciaDaBorda = (e: React.PointerEvent<SVGSVGElement>, i: number): number => {
    const r = e.currentTarget.getBoundingClientRect()
    return Math.abs(e.clientX - (r.left + (X(i) / W) * r.width))
  }

  function aoTocar(e: React.PointerEvent<SVGSVGElement>): void {
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sem captura: segue dentro do gráfico */ }
    if (sel) {
      const da = distanciaDaBorda(e, sel.a)
      const db = distanciaDaBorda(e, sel.b)
      if (Math.min(da, db) <= 26) {   // pegou uma borda: arrastar para aumentar ou diminuir o período
        modo.current = { tipo: 'borda', lado: da <= db ? 'a' : 'b' }
        return
      }
    }
    modo.current = { tipo: 'novo', ancora: indiceDe(e) }
    setSel(null)
  }
  function aoMover(e: React.PointerEvent<SVGSVGElement>): void {
    const m = modo.current
    if (!m) return
    const i = indiceDe(e)   // calculado antes: o evento do React não vale mais dentro do setSel
    if (m.tipo === 'novo') {
      if (i !== m.ancora) setSel({ a: Math.min(m.ancora, i), b: Math.max(m.ancora, i) })
    } else {
      setSel((s) => {
        if (!s) return s
        return m.lado === 'a' ? { a: Math.min(i, s.b - 1), b: s.b } : { a: s.a, b: Math.max(i, s.a + 1) }
      })
    }
  }
  function aoSoltar(): void {
    modo.current = null
  }

  const r: ResultadoIntervalo | null = sel && calcular ? calcular(base[sel.a].x, base[sel.b].x) : null

  return (
    <div className="grafico">
      <div className="grafico-legenda">
        {series.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome}</span>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" onPointerDown={aoTocar} onPointerMove={aoMover} onPointerUp={aoSoltar} onPointerCancel={aoSoltar} style={{ touchAction: 'pan-y', userSelect: 'none' }}>
        {[0, 0.5, 1].map((f) => <line key={f} x1={0} x2={W} y1={Y(lo + (hi - lo) * f)} y2={Y(lo + (hi - lo) * f)} stroke="var(--borda)" strokeWidth="1" />)}
        {sel && <rect x={X(sel.a)} y={pad.t} width={X(sel.b) - X(sel.a)} height={H - pad.t - pad.b} fill="rgba(108,108,255,.16)" />}
        {series.map((s) => <path key={s.nome} d={caminho(s)} fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" strokeDasharray={s.tracejada ? '5 4' : undefined} />)}
        {marcas.map((m, k) => <circle key={k} cx={X(Math.min(base.length - 1, idx(m.x)))} cy={Y(m.y)} r="3.5" fill="#fff" stroke="var(--fundo)" strokeWidth="1.5" />)}
        {sel && [sel.a, sel.b].map((i) => (
          <g key={i === sel.a ? 'a' : 'b'}>
            <line x1={X(i)} x2={X(i)} y1={pad.t} y2={H - pad.b} stroke="var(--texto)" strokeWidth="1.5" />
            <rect x={X(i) - 5} y={(H - pad.b + pad.t) / 2 - 14} width="10" height="28" rx="5" fill="var(--texto)" />
            <path d={`M${X(i) - 1.5},${(H - pad.b + pad.t) / 2 - 5} v10 M${X(i) + 1.5},${(H - pad.b + pad.t) / 2 - 5} v10`} stroke="var(--fundo)" strokeWidth="1" />
          </g>
        ))}
        <text x={pad.l} y={H - 4} fill="var(--texto-2)" fontSize="10">{fdata(base[0].x)}</text>
        <text x={W - pad.r} y={H - 4} fill="var(--texto-2)" fontSize="10" textAnchor="end">{fdata(base[base.length - 1].x)}</text>
      </svg>

      {calcular && (
        // Caixa SEMPRE do mesmo tamanho (com ou sem seleção), para a tela não "pular" ao escolher as datas.
        <div className={`caixa-intervalo ${r ? '' : 'vazia'}`}>
          <div className="int-datas">{r ? `${fdata(r.inicio)} – ${fdata(r.fim)}` : 'Toque num ponto e arraste até outro'}</div>
          <div className="int-valores">{r ? `${formato(r.valor_inicio)} → ${formato(r.valor_fim)}` : 'depois puxe as bordas para ajustar'}</div>
          <div className={`int-pct ${r ? corDe(r.pct) : ''}`}>{r ? (r.pct === null ? '–' : pct(r.pct, true)) : '–'}</div>
          <div className={`int-dif ${r ? corDe(r.diferenca) : ''}`}>{r ? `${r.diferenca > 0 ? '+' : r.diferenca < 0 ? '−' : ''}${formato(Math.abs(r.diferenca))}` : '–'}</div>
          <div className="int-nota">
            {r && r.compras ? `sem contar ${brl(r.compras)} de compras` : r && r.vendas ? `sem contar ${brl(r.vendas)} de vendas` : r && r.estimado ? 'inclui preço estimado' : ' '}
          </div>
          <button className="int-limpar" style={{ visibility: r ? 'visible' : 'hidden' }} onClick={() => setSel(null)}>Limpar seleção</button>
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
