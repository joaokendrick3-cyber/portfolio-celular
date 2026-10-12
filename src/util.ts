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
