import { useMemo, useState } from 'react'
import type { Ativo, Resumo } from './tipos'
import { brl, corDe, cotas, data, dataCurta, mesCurto, moeda, pct, sinalBRL } from './util'
import { BarrasMes, BarrasPct, Linhas } from './graficos'

export function Titulo({ children, sub }: { children: string; sub?: string }) {
  return <div className="titulo-tela"><h1>{children}</h1>{sub && <small>{sub}</small>}</div>
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
  const [intervalo, setIntervalo] = useState<'3m' | '6m' | 'tudo'>('tudo')
  const evo = useMemo(() => {
    const todos = d.evolucao
    const n = intervalo === '3m' ? 66 : intervalo === '6m' ? 130 : todos.length
    return todos.slice(-n)
  }, [d.evolucao, intervalo])
  return (
    <>
      <Titulo sub={d.dolar ? `Dólar ${d.dolar.valor.toFixed(4).replace('.', ',')} (${d.dolar.data})` : undefined}>Dashboard</Titulo>
      <section className="cartao destaque">
        <small className="rotulo">Patrimônio</small>
        <strong className="gigante">{brl(d.patrimonio)}</strong>
        <span className={corDe(d.retorno_total)}>{sinalBRL(d.retorno_total)} · {pct(d.retorno_total_pct, true)} <span className="suave">retorno total (com proventos)</span></span>
      </section>
      <section className="grade-2">
        <div className="cartao numero"><small>Investido</small><strong>{brl(d.investido)}</strong></div>
        <div className="cartao numero"><small>Valorização</small><strong className={corDe(d.valorizacao)}>{sinalBRL(d.valorizacao)}</strong><span className={corDe(d.valorizacao_pct)}>{pct(d.valorizacao_pct, true)}</span></div>
        <div className="cartao numero"><small>Proventos recebidos</small><strong>{brl(d.proventos_recebidos)}</strong></div>
        <div className="cartao numero"><small>A receber</small><strong>{brl(d.proventos_a_receber)}</strong></div>
      </section>
      <section className="cartao">
        <div className="linha topo-cartao"><small className="rotulo">Evolução do patrimônio</small>
          <div className="mini-seg">{(['3m', '6m', 'tudo'] as const).map((v) => <button key={v} className={intervalo === v ? 'ativa' : ''} onClick={() => setIntervalo(v)}>{v === 'tudo' ? 'Tudo' : v}</button>)}</div>
        </div>
        <Linhas series={[
          { nome: 'Patrimônio', cor: '#6c6cff', pontos: evo.map((p) => ({ x: p.data, y: p.valor })) },
          { nome: 'Investido', cor: '#8b90a5', tracejada: true, pontos: evo.map((p) => ({ x: p.data, y: p.investido })) }
        ]} />
      </section>
      <section className="cartao">
        <small className="rotulo">Por classe</small>
        <BarrasPct itens={d.classes.map((c, i) => ({ nome: c.classe, valor: c.participacao, cor: CORES[i % CORES.length], texto: `${pct(c.participacao)} · ${brl(c.valor_atual)}` }))} />
      </section>
      {d.cotacoes_origem.length > 0 && <p className="suave centro">Cotações: {d.cotacoes_origem.map((o) => `${o.fonte} (${o.referencia_em})`).join(' · ')}</p>}
    </>
  )
}

// ---------------------------------------------------------------------------------------- Carteira
export function Carteira({ r, onAtivo }: { r: Resumo; onAtivo: (t: string) => void }) {
  const [classe, setClasse] = useState('todas')
  const ativos = r.dashboard.ativos.filter((a) => classe === 'todas' || a.classe === classe)
  const classes = [...new Set(r.dashboard.ativos.map((a) => a.classe))]
  const linha = (a: Ativo) => (
    <button className="linha clicavel ativo" key={a.ticker} onClick={() => onAtivo(a.ticker)}>
      <Logo r={r} ticker={a.ticker} nome={a.exibicao} />
      <div className="col"><strong>{a.exibicao}</strong><small>{cotas(a.cotas)} cotas · PM {moeda(a.preco_medio, a.moeda)}</small></div>
      <div className="col direita"><b>{brl(a.valor_atual)}</b><small className={corDe(a.valorizacao)}>{pct(a.valorizacao_pct, true)}</small></div>
    </button>
  )
  return (
    <>
      <Titulo sub={`${r.dashboard.ativos.length} ativos · ${brl(r.dashboard.patrimonio)}`}>Carteira</Titulo>
      <div className="segmentos rolavel">
        {['todas', ...classes].map((c) => <button key={c} className={classe === c ? 'ativa' : ''} onClick={() => setClasse(c)}>{c === 'todas' ? 'Todas' : c}</button>)}
      </div>
      <section className="cartao">{ativos.map(linha)}</section>
    </>
  )
}

// ---------------------------------------------------------------------------------------- Proventos
export function Proventos({ r }: { r: Resumo }) {
  const p = r.painelProventos
  const meses = p.por_mes.slice(-12)
  const proximos = r.proventos.filter((x) => x.pagamento && x.pagamento >= r.hoje).sort((a, b) => (a.pagamento! < b.pagamento! ? -1 : 1))
  const recentes = r.proventos.filter((x) => x.pagamento && x.pagamento < r.hoje).slice(0, 12)
  return (
    <>
      <Titulo sub="Dividendos, JCP e rendimentos">Proventos</Titulo>
      <section className="grade-2">
        <div className="cartao numero"><small>Recebido (12 meses)</small><strong>{brl(p.recebido_12m)}</strong></div>
        <div className="cartao numero"><small>A receber</small><strong>{brl(p.a_receber)}</strong></div>
        <div className="cartao numero"><small>Média mensal</small><strong>{brl(p.media_mensal)}</strong></div>
        <div className="cartao numero"><small>Yield on cost 12m</small><strong>{pct(p.yield_on_cost_12m)}</strong></div>
      </section>
      <section className="cartao">
        <small className="rotulo">Por mês</small>
        <BarrasMes itens={meses.map((m) => ({ rotulo: mesCurto(m.mes), recebido: m.recebido, aReceber: m.a_receber }))} />
        <div className="legenda"><span><i className="am recebido" /> Recebido</span><span><i className="am a-receber" /> A receber</span></div>
      </section>
      {proximos.length > 0 && (
        <section className="cartao"><small className="rotulo">Próximos pagamentos</small>
          {proximos.slice(0, 10).map((x, i) => <div className="linha" key={i}><div className="col"><strong>{x.exibicao}</strong><small>{x.tipo} · {cotas(x.quantidade)} cotas</small></div><div className="col direita"><b>{brl(x.total_liquido)}</b><small>{data(x.pagamento)}</small></div></div>)}
        </section>
      )}
      <section className="cartao"><small className="rotulo">Por ativo (total recebido)</small>
        {p.por_ativo.map((a) => <div className="linha" key={a.ticker}><div className="col"><strong>{a.exibicao}</strong>{a.yoc !== null && <small>yield on cost {pct(a.yoc)}</small>}</div><b>{brl(a.recebido)}</b></div>)}
      </section>
      <section className="cartao"><small className="rotulo">Últimos pagamentos</small>
        {recentes.map((x, i) => <div className="linha" key={i}><div className="col"><strong>{x.exibicao}</strong><small>{x.tipo} · {data(x.pagamento)}</small></div><b>{brl(x.total_liquido)}</b></div>)}
      </section>
    </>
  )
}
