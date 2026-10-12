// De onde vem o resumo: Supabase (produção), arquivo local (desenvolvimento) e cache do aparelho (offline).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Resumo } from './tipos'

export const VERSAO_ENTENDIDA = 1
const CHAVE_CACHE = 'portfolio-resumo-v1'
const URL_SB = import.meta.env.VITE_SUPABASE_URL as string | undefined
const CHAVE_SB = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const temSupabase = Boolean(URL_SB && CHAVE_SB)
export const supabase: SupabaseClient | null = temSupabase
  ? createClient(URL_SB!, CHAVE_SB!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

export function lerCache(): Resumo | null {
  try {
    const t = localStorage.getItem(CHAVE_CACHE)
    return t ? (JSON.parse(t) as Resumo) : null
  } catch { return null }
}
function gravarCache(r: Resumo): void {
  try { localStorage.setItem(CHAVE_CACHE, JSON.stringify(r)) } catch { /* sem espaço: segue sem cache */ }
}
export function limparCache(): void {
  try { localStorage.removeItem(CHAVE_CACHE) } catch { /* ignora */ }
}

export async function baixarResumo(): Promise<Resumo> {
  let r: Resumo
  if (supabase) {
    const { data, error } = await supabase.from('snapshots').select('dados').eq('id', 'portfolio').maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Ainda não há resumo na nuvem. Abra o Portfólio no computador (com as chaves do Supabase no .env) e atualize.')
    r = data.dados as Resumo
  } else if (import.meta.env.DEV) {
    const resp = await fetch('/dev-resumo.json')
    if (!resp.ok) throw new Error('Sem resumo de desenvolvimento (dev/resumo-real.json).')
    r = (await resp.json()) as Resumo
  } else {
    throw new Error('O app não está ligado ao Supabase.')
  }
  gravarCache(r)
  return r
}
