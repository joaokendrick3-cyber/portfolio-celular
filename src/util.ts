const nfBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const nfUSD = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })
const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const nfCotas = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 })

export const brl = (n: number | null | undefined): string => (n === null || n === undefined ? '–' : nfBRL.format(n))
export const moeda = (n: number | null | undefined, m = 'BRL'): string => (n === null || n === undefined ? '–' : m === 'USD' ? nfUSD.format(n) : nfBRL.format(n))
export const num2 = (n: number | null | undefined): string => (n === null || n === undefined ? '–' : nf2.format(n))
export const cotas = (n: number): string => nfCotas.format(n)
/** 0.1234 -> "12,34%"; com sinal opcional. */
export const pct = (n: number | null | undefined, sinal = false): string =>
  n === null || n === undefined ? '–' : `${sinal && n > 0 ? '+' : ''}${nf2.format(n * 100)}%`
export const sinalBRL = (n: number): string => `${n > 0 ? '+' : ''}${nfBRL.format(n)}`
export const corDe = (n: number | null | undefined): string => (!n ? '' : n > 0 ? 'pos' : 'neg')

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
/** "2026-10-12" -> "12/10/2026" */
export const data = (iso: string | null | undefined): string => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '–')
export const dataCurta = (iso: string | null | undefined): string => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '–')
/** "2026-09" -> "set/26" */
export const mesCurto = (ym: string): string => `${MESES[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`
export const hoje = (): string => new Date().toISOString().slice(0, 10)

import type { Ativo, Lancamento, PontoEvolucao, ResultadoIntervalo } from './tipos'

/** Cotação e preço médio na moeda do ativo (US$ para VOO e BTC; R$ para o resto), como no computador. */
export const cotacaoDe = (a: Ativo): string => (a.moeda === 'USD' ? moeda(a.cotacao_usd ?? null, 'USD') : brl(a.cotacao))
export const precoMedioDe = (a: Ativo): string => (a.moeda === 'USD' ? moeda(a.preco_medio_usd ?? null, 'USD') : brl(a.preco_medio))

/** O último ponto com data até `dia` (o gráfico pode não ter ponto exatamente naquele dia). */
function pontoAte<T extends { data: string }>(pontos: T[], dia: string): T | null {
  let achado: T | null = null
  for (const p of pontos) { if (p.data <= dia) achado = p; else break }
  return achado
}

/** Evolução do patrimônio entre duas datas, sem contar aportes (mesma conta do computador, calculos/intervalo.py):
 *  resultado = valor no fim − valor no início − compras + vendas;  % = resultado ÷ (valor no início + compras). */
export function intervaloPatrimonio(pontos: PontoEvolucao[], lancamentos: Lancamento[], a: string, b: string): ResultadoIntervalo | null {
  const [d1, d2] = a <= b ? [a, b] : [b, a]
  const p1 = pontoAte(pontos, d1)
  const p2 = pontoAte(pontos, d2)
  if (!p1 || !p2) return null
  const movs = lancamentos.filter((l) => l.data && p1.data < l.data && l.data <= p2.data)
  const compras = movs.filter((l) => l.tipo === 'compra').reduce((t, l) => t + l.total, 0)
  const vendas = movs.filter((l) => l.tipo === 'venda').reduce((t, l) => t + l.total, 0)
  const resultado = p2.valor - p1.valor - compras + vendas
  const base = p1.valor + compras
  return {
    inicio: p1.data, fim: p2.data, valor_inicio: p1.valor, valor_fim: p2.valor, diferenca: resultado, pct: base ? resultado / base : null,
    compras, vendas, estimado: pontos.some((p) => p.estimado && p1.data <= p.data && p.data <= p2.data)
  }
}

/** Variação do preço de um ativo entre duas datas: preço no fim ÷ preço no início − 1. */
export function intervaloPreco(precos: { data: string; preco: number; estimado: boolean }[], a: string, b: string): ResultadoIntervalo | null {
  const [d1, d2] = a <= b ? [a, b] : [b, a]
  const p1 = pontoAte(precos, d1)
  const p2 = pontoAte(precos, d2)
  if (!p1 || !p2 || !p1.preco) return null
  return {
    inicio: p1.data, fim: p2.data, valor_inicio: p1.preco, valor_fim: p2.preco, diferenca: p2.preco - p1.preco, pct: p2.preco / p1.preco - 1,
    estimado: precos.some((p) => p.estimado && p1.data <= p.data && p.data <= p2.data)
  }
}

export const PERIODOS_GRAFICO: [string, string][] = [['1d', '1 dia'], ['7d', '7 dias'], ['1m', '1 mês'], ['3m', '3 meses'], ['6m', '6 meses'], ['ytd', 'No ano'], ['12m', '12 meses'], ['tudo', 'Tudo']]

/** Recorta uma série (ordenada por data) para o período escolhido, contando a partir do último ponto. */
export function recortar<T extends { data: string }>(pontos: T[], periodo: string): T[] {
  if (periodo === 'tudo' || pontos.length < 3) return pontos
  const fim = new Date(pontos[pontos.length - 1].data + 'T12:00:00')
  const c = new Date(fim)
  if (periodo === '1d') c.setDate(c.getDate() - 1)
  else if (periodo === '7d') c.setDate(c.getDate() - 7)
  else if (periodo === '1m') c.setMonth(c.getMonth() - 1)
  else if (periodo === '3m') c.setMonth(c.getMonth() - 3)
  else if (periodo === '6m') c.setMonth(c.getMonth() - 6)
  else if (periodo === '12m') c.setFullYear(c.getFullYear() - 1)
  else if (periodo === 'ytd') { c.setMonth(0); c.setDate(1) }
  const corte = c.toISOString().slice(0, 10)
  const r = pontos.filter((p) => p.data >= corte)
  return r.length >= 2 ? r : pontos.slice(-2)
}
