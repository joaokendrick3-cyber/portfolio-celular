import { useMemo, useState } from 'react'
import type { Resumo } from './tipos'
import { brl, cotas, corDe, cotacaoDe, data, intervaloPreco, moeda, pct, precoMedioDe, sinalBRL } from './util'
import { Linhas } from './graficos'
import { Logo, Titulo } from './telas'

const Voltar = ({ onVoltar }: { onVoltar: () => void }) => <button className="voltar" onClick={onVoltar}>‹ Voltar</button>

// ---------------------------------------------------------------------------------------- Detalhe do ativo
export function DetalheAtivo({ r, ticker, onVoltar }: { r: Resumo; ticker: string; onVoltar: () => void }) {
  const d = r.detalhes[ticker]
  if (!d) {
    return (
      <>
        <Voltar onVoltar={onVoltar} />
        <Titulo>{ticker}</Titulo>
        <section className="cartao"><span className="suave">Os detalhes deste ativo ainda não foram enviados pelo computador.</span></section>
      </>
    )
  }
  const s = d.resumo
  const g = d.grafico
  return (
    <>
      <Voltar onVoltar={onVoltar} />
      <Titulo sub={`${d.nome ?? ''}${d.setor ? ' · ' + d.setor : ''}`}>{d.exibicao}</Titulo>
      <section className="cartao destaque">
        <small className="rotulo">Valor atual da posição</small>
        <strong className="gigante">{brl(s.valor_atual)}</strong>
      </section>
      <section className="grade-2">
        <div className="cartao numero fixo pequeno"><small>Valorização (R$)</small><strong className={corDe(s.valorizacao)}>{sinalBRL(s.valorizacao)}</strong></div>
        <div className="cartao numero fixo pequeno"><small>Valorização (%)</small><strong className={corDe(s.valorizacao_pct)}>{pct(s.valorizacao_pct, true)}</strong></div>
      </section>
      <section className="cartao quatro-col">
        <div><small>Cotação</small><b>{cotacaoDe(s)}</b></div>
        <div><small>Preço médio</small><b>{precoMedioDe(s)}</b></div>
        <div><small>Cotas</small><b>{cotas(s.cotas)}</b></div>
        <div><small>Investido</small><b>{brl(s.investido)}</b></div>
        <div><small>% da carteira</small><b>{pct(s.participacao)}</b></div>
        <div><small>Proventos</small><b>{brl(s.proventos_recebidos)}</b></div>
        {s.moeda === 'USD' && d.dolar_hoje ? <div><small>Dólar (PTAX)</small><b>R$ {d.dolar_hoje.toFixed(4).replace('.', ',')}</b></div> : null}
      </section>
      <section className="cartao">
        <small className="rotulo">Preço, preço médio e compras</small>
        <Linhas
          formato={(n) => moeda(n, g.moeda)}
          calcular={(i, f) => intervaloPreco(g.precos, i, f)}
          series={[
            { nome: 'Preço', cor: '#6c6cff', pontos: g.precos.map((p) => ({ x: p.data, y: p.preco })) },
            ...(g.preco_medio.length > 1 ? [{ nome: 'Preço médio', cor: '#facc15', tracejada: true, pontos: g.preco_medio.map((p) => ({ x: p.data, y: p.valor })) }] : [])
          ]}
          marcas={g.compras.map((c) => ({ x: c.data, y: c.preco }))}
        />
        {s.fonte && <small className="suave">{s.fonte}</small>}
      </section>
      {d.agenda.length > 0 && <section className="cartao"><small className="rotulo">Agenda</small>{d.agenda.map((e, i) => <div className="linha" key={i}><span>{e.descricao}</span><span className="selo">{data(e.data)}</span></div>)}</section>}
      <section className="cartao"><small className="rotulo">Histórico de operações</small>
        {d.historico.map((h, i) => (
          <div className="linha" key={i}>
            <div className="col"><strong>{h.tipo === 'compra' ? 'Compra' : h.tipo === 'venda' ? 'Venda' : h.tipo}</strong><small>{data(h.data)} · {cotas(h.cotas)} × {brl(h.preco)}</small></div>
            <div className="col direita"><b>{brl(h.total)}</b><small>PM depois: {brl(h.preco_medio_apos)}</small></div>
          </div>
        ))}
      </section>
      {d.proventos.length > 0 && <section className="cartao"><small className="rotulo">Proventos</small>
        {d.proventos.map((p, i) => <div className="linha" key={i}><div className="col"><strong>{p.tipo}</strong><small>pago em {data(p.pagamento)}</small></div><b>{brl(p.total_liquido)}</b></div>)}
      </section>}
      <ListaEventos r={r} eventos={d.eventos.slice(0, 15)} mostrarAtivo={false} />
    </>
  )
}

// ---------------------------------------------------------------------------------------- Eventos
function ListaEventos({ r, eventos, mostrarAtivo = true }: { r: Resumo; eventos: Resumo['eventos']; mostrarAtivo?: boolean }) {
  return (
    <section className="cartao">
      <small className="rotulo">Eventos e notícias</small>
      {eventos.length === 0 && <span className="suave">Nada por aqui.</span>}
      {eventos.map((e, i) => {
        const corpo = (
          <>
            {mostrarAtivo && <Logo r={r} ticker={e.ticker} nome={e.exibicao} />}
            <div className="col prov-nome">
              <strong className="titulo-evento">{e.titulo}</strong>
              <small>{mostrarAtivo ? e.exibicao + ' · ' : ''}{e.fonte ?? ''} · {data(e.data)}</small>
            </div>
            <div className="col direita">
              {e.oficial && <span className="selo verde">oficial</span>}
              {e.opiniao && <span className="selo">opinião</span>}
            </div>
          </>
        )
        return e.link ? <a className="linha evento ativo" key={i} href={e.link} target="_blank" rel="noreferrer">{corpo}</a> : <div className="linha evento ativo" key={i}>{corpo}</div>
      })}
    </section>
  )
}

export function Eventos({ r, onVoltar }: { r: Resumo; onVoltar: () => void }) {
  const [filtro, setFiltro] = useState('todos')
  const [ticker, setTicker] = useState('todos')
  const tickers = [...new Set(r.eventos.map((e) => e.exibicao))]
  const lista = r.eventos.filter((e) => (filtro === 'todos' || e.categoria === filtro) && (ticker === 'todos' || e.exibicao === ticker)).slice(0, 80)
  return (
    <>
      <Voltar onVoltar={onVoltar} />
      <Titulo>Eventos</Titulo>
      <section className="cartao filtros">
        <select value={ticker} onChange={(e) => setTicker(e.target.value)}><option value="todos">Todos os ativos</option>{tickers.map((t) => <option key={t}>{t}</option>)}</select>
        <div className="segmentos">{[['todos', 'Todos'], ['noticia', 'Notícias'], ['documento', 'Documentos']].map(([v, t]) => <button key={v} className={filtro === v ? 'ativa' : ''} onClick={() => setFiltro(v)}>{t}</button>)}</div>
      </section>
      <ListaEventos r={r} eventos={lista} />
    </>
  )
}

// ---------------------------------------------------------------------------------------- Lançamentos
export function Lancamentos({ r, onVoltar }: { r: Resumo; onVoltar: () => void }) {
  const [tipo, setTipo] = useState('todos')
  const lista = r.lancamentos.filter((l) => tipo === 'todos' || l.tipo === tipo)
  const exibicaoDe = (ticker: string): string => r.dashboard.ativos.find((a) => a.ticker === ticker)?.exibicao ?? ticker
  const moedaDe = (ticker: string): string => r.dashboard.ativos.find((a) => a.ticker === ticker)?.moeda ?? 'BRL'   // VOO e BTC: preço em US$
  return (
    <>
      <Voltar onVoltar={onVoltar} />
      <Titulo sub={`${r.lancamentos.length} operações`}>Lançamentos</Titulo>
      <div className="segmentos">{[['todos', 'Todos'], ['compra', 'Compras'], ['venda', 'Vendas']].map(([v, t]) => <button key={v} className={tipo === v ? 'ativa' : ''} onClick={() => setTipo(v)}>{t}</button>)}</div>
      <section className="cartao">
        {lista.map((l, i) => (
          <div className="linha ativo" key={i}>
            <Logo r={r} ticker={l.ticker} nome={exibicaoDe(l.ticker)} />
            <div className="col prov-nome">
              <strong>{exibicaoDe(l.ticker)}</strong>
              <small>Cotas {cotas(l.cotas)}</small>
              <small>{l.tipo === 'venda' ? 'Preço' : 'PM'} {moeda(l.preco_unitario, moedaDe(l.ticker))}</small>
            </div>
            <div className="col direita">
              <b className="verde">{brl(l.total)}</b>
              <span className={`selo ${l.tipo === 'venda' ? 'vermelho-suave' : 'verde'}`}>{l.tipo === 'compra' ? 'Compra' : l.tipo === 'venda' ? 'Venda' : l.tipo}</span>
              <small>{data(l.data)}</small>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------------------- Notificações
export function Notificacoes({ r, onVoltar }: { r: Resumo; onVoltar: () => void }) {
  const [aba, setAba] = useState<'nao' | 'lidas'>('nao')
  const naoLidas = r.notificacoes.lista.filter((n) => !n.lida)
  const lidas = r.notificacoes.lista.filter((n) => n.lida)
  const lista = aba === 'nao' ? naoLidas : lidas
  const exibicaoDe = (ticker: string, padrao: string): string => r.dashboard.ativos.find((a) => a.ticker === ticker)?.exibicao ?? padrao
  return (
    <>
      <Voltar onVoltar={onVoltar} />
      <Titulo>Notificações</Titulo>
      <div className="segmentos">
        <button className={aba === 'nao' ? 'ativa' : ''} onClick={() => setAba('nao')}>Não lidas ({naoLidas.length})</button>
        <button className={aba === 'lidas' ? 'ativa' : ''} onClick={() => setAba('lidas')}>Lidas ({lidas.length})</button>
      </div>
      <section className="cartao">
        {lista.length === 0 && <span className="suave vazio-lista">{aba === 'nao' ? 'Nenhuma notificação nova.' : 'Nenhuma notificação lida.'}</span>}
        {lista.map((n) => {
          const nome = exibicaoDe(n.ticker, n.exibicao)
          const corpo = (
            <>
              <Logo r={r} ticker={n.ticker} nome={nome} />
              <div className="col prov-nome"><strong className="titulo-evento">{n.titulo ?? n.descricao}</strong><small>{nome} · {data(n.data)}{n.fonte ? ' · ' + n.fonte : ''}</small></div>
              {!n.lida && <i className="ponto" />}
            </>
          )
          return n.link
            ? <a className="linha evento ativo" key={n.id} href={n.link} target="_blank" rel="noreferrer">{corpo}</a>
            : <div className="linha ativo" key={n.id}>{corpo}</div>
        })}
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------------------- Menu "Mais"
export type ParteMais = 'menu' | 'eventos' | 'lancamentos' | 'notificacoes'

export function Mais({ r, onIr, onSair }: { r: Resumo; onIr: (p: ParteMais) => void; onSair?: () => void }) {
  return (
    <>
      <Titulo>Mais</Titulo>
      <section className="cartao menu-mais">
        <button onClick={() => onIr('notificacoes')}><span>Notificações</span>{r.notificacoes.nao_lidas > 0 && <i className="bolinha">{r.notificacoes.nao_lidas}</i>}<b>›</b></button>
        <button onClick={() => onIr('eventos')}><span>Eventos e notícias</span><b>›</b></button>
        <button onClick={() => onIr('lancamentos')}><span>Lançamentos</span><b>›</b></button>
        {onSair && <button className="sair" onClick={onSair}><span>Sair</span></button>}
      </section>
    </>
  )
}
