import { useMemo, useState } from 'react'
import type { Ativo, Resumo } from './tipos'
import { brl, corDe, cotas, data, dataCurta, intervaloPatrimonio, mesCurto, pct, PERIODOS_GRAFICO, precoMedioDe, recortar, sinalBRL } from './util'
import { BarrasMes, Linhas } from './graficos'

export function Titulo({ children, sub, direita }: { children: string; sub?: string; direita?: string }) {
  return (
    <div className="titulo-tela">
      <div className="titulo-linha"><h1>{children}</h1>{direita && <strong className="titulo-direita">{direita}</strong>}</div>
      {sub && <small>{sub}</small>}
    </div>
  )
}

const CORES = ['#6c6cff', '#22d3ee', '#4ade80', '#facc15', '#f472b6', '#fb923c', '#a78bfa']

function Logo({ r, ticker, nome }: { r: Resumo; ticker: string; nome: string }) {
  const src = r.logos[ticker]
  return src ? <img className="logo-ativo" src={src} alt="" /> : <span className="logo-ativo letra">{nome.slice(0, 2)}</span>
}

// ---------------------------------------------------------------------------------------- Radar
const PERIODOS: [string, string][] = [['tudo', 'Desde o início'], ['12m', 'Últimos 12 meses'], ['ano', 'No ano'], ['mes', 'Últimos 30 dias'], ['semana', 'Últimos 7 dias'], ['visita', 'Desde a última visita'], ['dia', 'No último pregão']]

export function Radar({ r, onAtivo }: { r: Resumo; onAtivo: (t: string) => void }) {
  const [periodo, setPeriodo] = useState('tudo')   // padrão: desde o início da carteira
  const [aberto, setAberto] = useState(false)
  const rd = r.radar[periodo]
  const ordenados = useMemo(() => [...(rd?.ativos ?? [])].sort((a, b) => Math.abs(b.resultado) - Math.abs(a.resultado)), [rd])
  return (
    <>
      <Titulo sub="O que mudou na carteira">Radar</Titulo>
      <div className="filtro">
        <button className="filtro-botao" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
          <span className={`seta ${aberto ? 'aberta' : ''}`}>›</span>
          <b>Filtro</b>
          <small>{PERIODOS.find(([v]) => v === periodo)?.[1]}</small>
        </button>
        {aberto && (
          <div className="filtro-opcoes">
            {PERIODOS.map(([v, t]) => (
              <button key={v} className={periodo === v ? 'ativa' : ''} onClick={() => { setPeriodo(v); setAberto(false) }}>{t}</button>
            ))}
          </div>
        )}
      </div>
      {!rd ? <section className="cartao"><span className="suave">Radar indisponível para este período.</span></section> : (
        <>
          <section className="cartao destaque">
            <small className="rotulo">Resultado {rd.rotulo}</small>
            <strong className={`gigante ${corDe(rd.resultado)}`}>{sinalBRL(rd.resultado)}</strong>
            <span className={corDe(rd.resultado_pct)}>{pct(rd.resultado_pct, true)}</span>
            {rd.total_proventos_pagos > 0 && <span className="suave">Proventos pagos no período: {brl(rd.total_proventos_pagos)}</span>}
          </section>
          <section className="cartao">
            <small className="rotulo">Por ativo</small>
            {ordenados.map((a) => (
              <button className="linha clicavel ativo" key={a.ticker} onClick={() => onAtivo(a.ticker)}>
                <Logo r={r} ticker={a.ticker} nome={a.exibicao} />
                <div className="col"><strong>{a.exibicao}</strong><small>{a.classe}</small></div>
                <div className="col direita"><b className={corDe(a.resultado)}>{sinalBRL(a.resultado)}</b><small className={corDe(a.variacao_pct ?? a.resultado_pct)}>{pct(a.variacao_pct ?? a.resultado_pct, true)}</small></div>
              </button>
            ))}
          </section>
          {rd.agenda.length > 0 && (
            <section className="cartao">
              <small className="rotulo">Próximos eventos</small>
              {rd.agenda.slice(0, 8).map((e, i) => (
                <div className="linha" key={i}>
                  <div className="col"><strong>{e.exibicao}</strong><small>{e.descricao}</small></div>
                  <span className="selo">{dataCurta(e.data)}</span>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------------------- Dashboard
export function Dashboard({ r }: { r: Resumo }) {
  const d = r.dashboard
  const [periodo, setPeriodo] = useState('tudo')
  const [aberto, setAberto] = useState(false)
  const evo = useMemo(() => recortar(d.evolucao, periodo), [d.evolucao, periodo])
  const calcular = (inicio: string, fim: string) => intervaloPatrimonio(d.evolucao, r.lancamentos, inicio, fim)
  const bloco = (rotulo: string, valor: string, classe = '') => (
    <div className="cartao numero fixo">
      <small>{rotulo}</small>
      <strong className={classe}>{valor}</strong>
    </div>
  )
  return (
    <>
      <Titulo>Dashboard</Titulo>
      <section className="cartao destaque">
        <small className="rotulo">Patrimônio</small>
        <strong className="gigante">{brl(d.patrimonio)}</strong>
      </section>
      <section className="grade-2">
        {bloco('Investido', brl(d.investido))}
        {bloco('Valorização', sinalBRL(d.valorizacao), corDe(d.valorizacao))}
        {bloco('Proventos recebidos', brl(d.proventos_recebidos))}
        {bloco('Valorização', pct(d.valorizacao_pct, true), corDe(d.valorizacao_pct))}
        {bloco('A receber', brl(d.proventos_a_receber))}
        {bloco('Retorno total', pct(d.retorno_total_pct, true), corDe(d.retorno_total_pct))}
      </section>
      <section className="cartao">
        <div className="linha topo-cartao"><small className="rotulo">Evolução do patrimônio</small></div>
        <div className="filtro compacto">
          <button className="filtro-botao" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
            <span className={`seta ${aberto ? 'aberta' : ''}`}>›</span>
            <b>Datas</b>
            <small>{PERIODOS_GRAFICO.find(([v]) => v === periodo)?.[1]}</small>
          </button>
          {aberto && (
            <div className="filtro-opcoes grade-opcoes">
              {PERIODOS_GRAFICO.map(([v, t]) => (
                <button key={v} className={periodo === v ? 'ativa' : ''} onClick={() => { setPeriodo(v); setAberto(false) }}>{t}</button>
              ))}
            </div>
          )}
        </div>
        <Linhas
          calcular={calcular}
          series={[
            { nome: 'Patrimônio', cor: '#6c6cff', pontos: evo.map((p) => ({ x: p.data, y: p.valor })) },
            { nome: 'Investido', cor: '#8b90a5', tracejada: true, pontos: evo.map((p) => ({ x: p.data, y: p.investido })) }
          ]}
        />
      </section>
      <section className="cartao">
        <small className="rotulo">Por classe</small>
        <div className="classes">
          {d.classes.map((c, i) => (
            <div className="classe" key={c.classe}>
              <div className="classe-topo">
                <span className="classe-nome"><i style={{ background: CORES[i % CORES.length] }} />{c.classe}</span>
                <b className="classe-pct">{pct(c.participacao)}</b>
              </div>
              <div className="trilha grossa"><i style={{ width: Math.max(2, c.participacao * 100) + '%', background: CORES[i % CORES.length] }} /></div>
              <div className="classe-base">
                <span className="classe-valor">{brl(c.valor_atual)}</span>
                <span className={`classe-val ${corDe(c.valorizacao_pct)}`}>{pct(c.valorizacao_pct, true)} <small>valorização</small></span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------------------- Carteira
export function Carteira({ r, onAtivo }: { r: Resumo; onAtivo: (t: string) => void }) {
  const [classe, setClasse] = useState('todas')
  const ativos = r.dashboard.ativos.filter((a) => classe === 'todas' || a.classe === classe)
  const classes = [...new Set(r.dashboard.ativos.map((a) => a.classe))]
  const total = ativos.reduce((t, a) => t + a.valor_atual, 0)   // muda junto com o filtro (todas, ações, FIIs, outros)
  const linha = (a: Ativo) => (
    <button className="linha clicavel carteira-linha" key={a.ticker} onClick={() => onAtivo(a.ticker)}>
      <Logo r={r} ticker={a.ticker} nome={a.exibicao} />
      <strong className="carteira-nome">{a.exibicao}</strong>
      <span className={`carteira-val ${corDe(a.valorizacao_pct)}`}>{pct(a.valorizacao_pct, true)}</span>
      <b className="carteira-valor">{brl(a.valor_atual)}</b>
    </button>
  )
  return (
    <>
      <Titulo sub={`${ativos.length} ${ativos.length === 1 ? 'ativo' : 'ativos'}`} direita={brl(total)}>Carteira</Titulo>
      <div className="segmentos rolavel">
        {['todas', ...classes].map((c) => <button key={c} className={classe === c ? 'ativa' : ''} onClick={() => setClasse(c)}>{c === 'todas' ? 'Todas' : c}</button>)}
      </div>
      <section className="cartao">{ativos.map(linha)}</section>
    </>
  )
}

// ---------------------------------------------------------------------------------------- Proventos
type Agrupar = 'mes' | 'trimestre' | 'semestre' | 'ano'
const AGRUPAR: [Agrupar, string][] = [['mes', 'Por mês'], ['trimestre', 'Por trimestre'], ['semestre', 'Por semestre'], ['ano', 'Por ano']]
const DATAS_PROV: [string, string][] = [['12m', 'Últimos 12 meses'], ['6m', 'Últimos 6 meses'], ['tudo', 'Desde o início']]

/** "2026-10" menos n meses. */
function mesesAtras(ym: string, n: number): string {
  const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Meses do gráfico: do passado até o mês atual (os vazios aparecem) e, do futuro, só os meses que têm provento a receber. */
function mesesDoGrafico(r: Resumo, datas: string): { mes: string; recebido: number; a_receber: number }[] {
  const hojeMes = r.hoje.slice(0, 7)
  const todos = r.painelProventos.por_mes
  const n = datas === '12m' ? 12 : datas === '6m' ? 6 : 0
  const corte = n ? mesesAtras(hojeMes, n - 1) : '0000-00'
  const passados = todos.filter((m) => m.mes <= hojeMes && m.mes >= corte)
  const futuros = todos.filter((m) => m.mes > hojeMes && m.recebido + m.a_receber > 0)
  return [...passados, ...futuros]
}

function agrupar(meses: { mes: string; recebido: number; a_receber: number }[], como: Agrupar): { rotulo: string; recebido: number; aReceber: number }[] {
  const grupos = new Map<string, { rotulo: string; recebido: number; aReceber: number }>()
  for (const m of meses) {
    const y = m.mes.slice(0, 4)
    const yy = y.slice(2)
    const mm = Number(m.mes.slice(5, 7))
    const [chave, rotulo] =
      como === 'mes' ? [m.mes, mesCurto(m.mes)]
        : como === 'trimestre' ? [`${y}-T${Math.ceil(mm / 3)}`, `${Math.ceil(mm / 3)}T${yy}`]
          : como === 'semestre' ? [`${y}-S${mm <= 6 ? 1 : 2}`, `${mm <= 6 ? 1 : 2}S${yy}`]
            : [y, y]
    const g = grupos.get(chave) ?? { rotulo, recebido: 0, aReceber: 0 }
    g.recebido += m.recebido
    g.aReceber += m.a_receber
    grupos.set(chave, g)
  }
  return [...grupos.values()]
}

function FiltroCompacto({ rotulo, valor, opcoes, onEscolher }: { rotulo: string; valor: string; opcoes: [string, string][]; onEscolher: (v: string) => void }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="filtro compacto">
      <button className="filtro-botao" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
        <span className={`seta ${aberto ? 'aberta' : ''}`}>›</span>
        <b>{rotulo}</b>
        <small>{opcoes.find(([v]) => v === valor)?.[1]}</small>
      </button>
      {aberto && (
        <div className="filtro-opcoes">
          {opcoes.map(([v, t]) => <button key={v} className={valor === v ? 'ativa' : ''} onClick={() => { onEscolher(v); setAberto(false) }}>{t}</button>)}
        </div>
      )}
    </div>
  )
}

export function Proventos({ r, onAtivo }: { r: Resumo; onAtivo?: (t: string) => void }) {
  const p = r.painelProventos
  const [como, setComo] = useState<Agrupar>('mes')
  const [datas, setDatas] = useState('12m')
  const barras = useMemo(() => agrupar(mesesDoGrafico(r, datas), como), [r, datas, como])
  const proximos = r.proventos.filter((x) => x.pagamento && x.pagamento >= r.hoje).sort((a, b) => (a.pagamento! < b.pagamento! ? -1 : 1))
  const recentes = r.proventos.filter((x) => x.pagamento && x.pagamento < r.hoje).slice(0, 12)
  const yoc = r.dashboard.investido ? p.recebido / r.dashboard.investido : null   // yield on cost de tudo que já recebeu
  const tickerDe = (exibicao: string, ticker?: string): string => ticker ?? exibicao
  return (
    <>
      <Titulo>Proventos</Titulo>
      <section className="grade-2">
        <div className="cartao numero fixo"><small>Recebido</small><strong>{brl(p.recebido)}</strong></div>
        <div className="cartao numero fixo"><small>A receber</small><strong>{brl(p.a_receber)}</strong></div>
        <div className="cartao numero fixo"><small>Média mensal</small><strong>{brl(p.media_mensal)}</strong></div>
        <div className="cartao numero fixo"><small>Yield on cost</small><strong>{pct(yoc)}</strong></div>
      </section>
      <section className="cartao">
        <small className="rotulo">{AGRUPAR.find(([v]) => v === como)?.[1]}</small>
        <FiltroCompacto rotulo="Agrupar" valor={como} opcoes={AGRUPAR} onEscolher={(v) => setComo(v as Agrupar)} />
        <FiltroCompacto rotulo="Datas" valor={datas} opcoes={DATAS_PROV} onEscolher={setDatas} />
        <BarrasMes itens={barras} />
        <div className="legenda"><span><i className="am recebido" /> Recebido</span><span><i className="am a-receber" /> A receber</span></div>
      </section>
      <section className="cartao"><small className="rotulo">Total por ativo</small>
        {p.por_ativo.map((a) => (
          <button className="linha clicavel carteira-linha" key={a.ticker} onClick={() => onAtivo?.(a.ticker)}>
            <Logo r={r} ticker={a.ticker} nome={a.exibicao} />
            <div className="col prov-nome"><strong>{a.exibicao}</strong>{a.yoc !== null && <small>yield on cost {pct(a.yoc)}</small>}</div>
            <div className="col direita"><b>{brl(a.recebido)}</b>{a.a_receber > 0 && <small>+ {brl(a.a_receber)} a receber</small>}</div>
          </button>
        ))}
      </section>
      {proximos.length > 0 && (
        <section className="cartao"><small className="rotulo">Próximos pagamentos</small>
          {proximos.slice(0, 10).map((x, i) => (
            <div className="linha ativo" key={i}>
              <Logo r={r} ticker={tickerDe(x.exibicao, x.ticker)} nome={x.exibicao} />
              <div className="col prov-nome"><strong>{x.exibicao}</strong><small>{x.tipo} · {cotas(x.quantidade)} cotas</small></div>
              <div className="col direita"><b>{brl(x.total_liquido)}</b><small>{data(x.pagamento)}</small></div>
            </div>
          ))}
        </section>
      )}
      <section className="cartao"><small className="rotulo">Últimos pagamentos</small>
        {recentes.map((x, i) => (
          <div className="linha ativo" key={i}>
            <Logo r={r} ticker={tickerDe(x.exibicao, x.ticker)} nome={x.exibicao} />
            <div className="col prov-nome"><strong>{x.exibicao}</strong><small>{x.tipo} · {data(x.pagamento)}</small></div>
            <b>{brl(x.total_liquido)}</b>
          </div>
        ))}
      </section>
    </>
  )
}
