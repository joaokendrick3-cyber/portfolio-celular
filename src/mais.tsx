import { useMemo, useState } from 'react'
import type { Resumo } from './tipos'
import { brl, cotas, corDe, cotacaoDe, data, intervaloPreco, moeda, pct, num2, precoMedioDe, sinalBRL } from './util'
import { Linhas } from './graficos'
import { Titulo } from './telas'

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
        <span className={corDe(s.valorizacao)}>{sinalBRL(s.valorizacao)} · {pct(s.valorizacao_pct, true)}</span>
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
      <ListaEventos eventos={d.eventos.slice(0, 15)} mostrarAtivo={false} />
    </>
  )
}

// ---------------------------------------------------------------------------------------- Eventos
function ListaEventos({ eventos, mostrarAtivo = true }: { eventos: Resumo['eventos']; mostrarAtivo?: boolean }) {
  return (
    <section className="cartao">
      <small className="rotulo">Eventos e notícias</small>
      {eventos.length === 0 && <span className="suave">Nada por aqui.</span>}
      {eventos.map((e, i) => {
        const corpo = (
          <>
            <div className="col">
              <strong className="titulo-evento">{e.titulo}</strong>
              <small>{mostrarAtivo ? e.exibicao + ' · ' : ''}{e.fonte ?? ''} · {data(e.data)}</small>
            </div>
            <div className="col direita">
              {e.oficial && <span className="selo verde">oficial</span>}
              {e.opiniao && <span className="selo">opinião</span>}
            </div>
          </>
        )
        return e.link ? <a className="linha evento" key={i} href={e.link} target="_blank" rel="noreferrer">{corpo}</a> : <div className="linha evento" key={i}>{corpo}</div>
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
      <Titulo sub="Documentos oficiais e notícias">Eventos</Titulo>
      <section className="cartao filtros">
        <select value={ticker} onChange={(e) => setTicker(e.target.value)}><option value="todos">Todos os ativos</option>{tickers.map((t) => <option key={t}>{t}</option>)}</select>
        <div className="segmentos">{[['todos', 'Todos'], ['noticia', 'Notícias'], ['documento', 'Documentos']].map(([v, t]) => <button key={v} className={filtro === v ? 'ativa' : ''} onClick={() => setFiltro(v)}>{t}</button>)}</div>
      </section>
      <ListaEventos eventos={lista} />
    </>
  )
}

// ---------------------------------------------------------------------------------------- Lançamentos
export function Lancamentos({ r, onVoltar }: { r: Resumo; onVoltar: () => void }) {
  const [tipo, setTipo] = useState('todos')
  const lista = r.lancamentos.filter((l) => tipo === 'todos' || l.tipo === tipo)
  return (
    <>
      <Voltar onVoltar={onVoltar} />
      <Titulo sub={`${r.lancamentos.length} operações`}>Lançamentos</Titulo>
      <div className="segmentos">{[['todos', 'Todos'], ['compra', 'Compras'], ['venda', 'Vendas']].map(([v, t]) => <button key={v} className={tipo === v ? 'ativa' : ''} onClick={() => setTipo(v)}>{t}</button>)}</div>
      <section className="cartao">
        {lista.map((l, i) => (
          <div className="linha" key={i}>
            <div className="col"><strong>{l.ticker}</strong><small>{l.tipo === 'compra' ? 'Compra' : l.tipo === 'venda' ? 'Venda' : l.tipo} · {data(l.data)} · {cotas(l.cotas)} × {num2(l.preco_unitario)}</small></div>
            <b>{brl(l.total)}</b>
          </div>
        ))}
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------------------- Observação
export function Observacao({ r, onVoltar }: { r: Resumo; onVoltar: () => void }) {
  const [busca, setBusca] = useState('')
  const linhas = useMemo(() => (r.observacao?.linhas ?? []).filter((l) => l.exibicao.toLowerCase().includes(busca.toLowerCase())), [r, busca])
  return (
    <>
      <Voltar onVoltar={onVoltar} />
      <Titulo sub="Ativos que você acompanha">Observação</Titulo>
      <section className="cartao filtros"><input className="busca" placeholder="Buscar ativo" value={busca} onChange={(e) => setBusca(e.target.value)} /></section>
      <section className="cartao">
        {linhas.length === 0 && <span className="suave">Nenhum ativo.</span>}
        {linhas.slice(0, 80).map((l) => (
          <div className="linha" key={l.exibicao}>
            <div className="col"><strong>{l.exibicao}</strong><small>{l.classe}{l.minimo_52s !== null && l.maximo_52s !== null ? ` · 52s ${num2(l.minimo_52s)} a ${num2(l.maximo_52s)}` : ''}</small></div>
            <div className="col direita">
              <b>{l.cotacao === null ? '–' : num2(l.cotacao)}</b>
              {l.justo !== null && <small className={corDe(l.margem_justo)}>justo {num2(l.justo)} ({pct(l.margem_justo, true)})</small>}
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------------------- Notificações
export function Notificacoes({ r, onVoltar }: { r: Resumo; onVoltar: () => void }) {
  return (
    <>
      <Voltar onVoltar={onVoltar} />
      <Titulo sub={`${r.notificacoes.nao_lidas} não lidas`}>Notificações</Titulo>
      <section className="cartao">
        {r.notificacoes.lista.map((n) => {
          const corpo = (
            <>
              <div className="col"><strong>{n.titulo ?? n.descricao}</strong><small>{n.exibicao} · {data(n.data)}{n.fonte ? ' · ' + n.fonte : ''}</small></div>
              {!n.lida && <i className="ponto" />}
            </>
          )
          return n.link ? <a className={`linha evento ${n.lida ? 'lida' : ''}`} key={n.id} href={n.link} target="_blank" rel="noreferrer">{corpo}</a> : <div className={`linha ${n.lida ? 'lida' : ''}`} key={n.id}>{corpo}</div>
        })}
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------------------- Menu "Mais"
export type ParteMais = 'menu' | 'eventos' | 'lancamentos' | 'observacao' | 'notificacoes'

export function Mais({ r, onIr, onSair }: { r: Resumo; onIr: (p: ParteMais) => void; onSair?: () => void }) {
  return (
    <>
      <Titulo>Mais</Titulo>
      <section className="cartao menu-mais">
        <button onClick={() => onIr('notificacoes')}><span>Notificações</span>{r.notificacoes.nao_lidas > 0 && <i className="bolinha">{r.notificacoes.nao_lidas}</i>}<b>›</b></button>
        <button onClick={() => onIr('eventos')}><span>Eventos e notícias</span><b>›</b></button>
        <button onClick={() => onIr('lancamentos')}><span>Lançamentos</span><b>›</b></button>
        <button onClick={() => onIr('observacao')}><span>Observação</span><b>›</b></button>
        <div className="em-breve"><span>Simulador</span><small>só no computador</small></div>
        {onSair && <button className="sair" onClick={onSair}><span>Sair</span></button>}
      </section>
    </>
  )
}
