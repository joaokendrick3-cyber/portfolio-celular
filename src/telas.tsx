import { useMemo, useState } from 'react'
import type { Ativo, Resumo } from './tipos'
import { brl, corDe, cotas, data, dataCurta, intervaloPatrimonio, mesCurto, pct, PERIODOS_GRAFICO, precoMedioDe, recortar, sinalBRL } from './util'
import { BarrasMes, Linhas } from './graficos'

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
  const [periodo, setPeriodo] = useState('tudo')
  const [aberto, setAberto] = useState(false)
  const evo = useMemo(() => recortar(d.evolucao, periodo), [d.evolucao, periodo])
  const calcular = (inicio: string, fim: string) => intervaloPatrimonio(d.evolucao, r.lancamentos, inicio, fim)
  const bloco = (rotulo: string, valor: string, classe = '', extra?: string) => (
    <div className="cartao numero">
      <small>{rotulo}</small>
      <strong className={classe}>{valor}</strong>
      {extra && <span className="suave">{extra}</span>}
    </div>
  )
  return (
    <>
      <Titulo>Dashboard</Titulo>
      <section className="cartao destaque">
        <small className="rotulo">Patrimônio</small>
        <strong className="gigante">{brl(d.patrimonio)}</strong>
        <span className={corDe(d.retorno_total)}>{sinalBRL(d.retorno_total)} · {pct(d.retorno_total_pct, true)} <span className="suave">retorno total (com proventos)</span></span>
      </section>
      <section className="grade-2">
        {bloco('Investido', brl(d.investido))}
        {bloco('Valorização', sinalBRL(d.valorizacao), corDe(d.valorizacao))}
        {bloco('Proventos recebidos', brl(d.proventos_recebidos))}
        {bloco('Valorização', pct(d.valorizacao_pct, true), corDe(d.valorizacao_pct), 'só o preço dos ativos')}
        {bloco('A receber', brl(d.proventos_a_receber))}
        {bloco('Retorno total', pct(d.retorno_total_pct, true), corDe(d.retorno_total_pct), 'com os proventos recebidos')}
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
      <div className="col"><strong>{a.exibicao}</strong><small>{cotas(a.cotas)} cotas · PM {precoMedioDe(a)}</small></div>
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
