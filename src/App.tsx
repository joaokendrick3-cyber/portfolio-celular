import { useCallback, useEffect, useState } from 'react'
import type { Resumo } from './tipos'
import { baixarResumo, lerCache, limparCache, supabase, temSupabase, VERSAO_ENTENDIDA } from './dados'
import Entrada from './Entrada'
import { Carteira, Dashboard, Proventos, Radar } from './telas'
import { DetalheAtivo, Eventos, Lancamentos, Mais, Notificacoes, Observacao, type ParteMais } from './mais'

type Aba = 'radar' | 'dashboard' | 'carteira' | 'proventos' | 'mais'
const ABAS: { id: Aba; nome: string; icone: string }[] = [
  { id: 'radar', nome: 'Radar', icone: 'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M19 5a10 10 0 0 0-12-2M3 9a10 10 0 1 0 18-1M16 8a6 6 0 1 0-8 9' },
  { id: 'dashboard', nome: 'Dashboard', icone: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z' },
  { id: 'carteira', nome: 'Carteira', icone: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' },
  { id: 'proventos', nome: 'Proventos', icone: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { id: 'mais', nome: 'Mais', icone: 'M5 12h.01M12 12h.01M19 12h.01' }
]

export default function App() {
  const [resumo, setResumo] = useState<Resumo | null>(() => lerCache())
  const [logado, setLogado] = useState<boolean | null>(temSupabase ? null : true)
  const [aba, setAba] = useState<Aba>('radar')
  const [parte, setParte] = useState<ParteMais>('menu')
  const [ativo, setAtivo] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const atualizar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      setResumo(await baixarResumo())
    } catch (e) {
      setErro(lerCache() ? 'Sem conexão: mostrando o último resumo salvo.' : (e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setLogado(Boolean(data.session)))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setLogado(Boolean(s)))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (logado) void atualizar()
  }, [logado, atualizar])
  useEffect(() => {
    const aoVoltar = (): void => {
      if (document.visibilityState === 'visible' && logado) void atualizar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [logado, atualizar])

  if (logado === null) return <div className="carregando">PORTFÓLIO</div>
  if (!logado) return <Entrada />
  const sair = async (): Promise<void> => {
    await supabase?.auth.signOut()
    limparCache()
    setResumo(null)
  }

  if (!resumo) {
    return (
      <div className="vazio-total">
        <h1>PORTFÓLIO</h1>
        <p>{carregando ? 'Baixando o resumo…' : erro || 'Sem dados ainda.'}</p>
        {!carregando && <button className="botao" onClick={() => void atualizar()}>Tentar de novo</button>}
      </div>
    )
  }
  if (resumo.versaoEsquema > VERSAO_ENTENDIDA) {
    return (
      <div className="vazio-total">
        <h1>Atualize o app</h1>
        <p>O Portfólio do computador está mais novo que este aplicativo. Feche e abra de novo para atualizar.</p>
      </div>
    )
  }

  const gerado = new Date(resumo.geradoEm)
  const horas = (Date.now() - gerado.getTime()) / 3600000
  const quando = gerado.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' às')
  const irPara = (a: Aba): void => {
    setAba(a)
    setParte('menu')
    setAtivo(null)
    window.scrollTo(0, 0)
  }

  let tela
  if (ativo) tela = <DetalheAtivo r={resumo} ticker={ativo} onVoltar={() => setAtivo(null)} />
  else if (aba === 'radar') tela = <Radar r={resumo} onAtivo={setAtivo} />
  else if (aba === 'dashboard') tela = <Dashboard r={resumo} />
  else if (aba === 'carteira') tela = <Carteira r={resumo} onAtivo={setAtivo} />
  else if (aba === 'proventos') tela = <Proventos r={resumo} />
  else if (parte === 'eventos') tela = <Eventos r={resumo} onVoltar={() => setParte('menu')} />
  else if (parte === 'lancamentos') tela = <Lancamentos r={resumo} onVoltar={() => setParte('menu')} />
  else if (parte === 'observacao') tela = <Observacao r={resumo} onVoltar={() => setParte('menu')} />
  else if (parte === 'notificacoes') tela = <Notificacoes r={resumo} onVoltar={() => setParte('menu')} />
  else tela = <Mais r={resumo} onIr={(p) => { setParte(p); window.scrollTo(0, 0) }} onSair={supabase ? () => void sair() : undefined} />

  return (
    <div className="app">
      <main className="conteudo">
        <header className="cabecalho">
          <div>
            <strong>PORTFÓLIO</strong>
            <small className={horas > 24 ? 'velho' : ''}>{horas > 24 ? 'Desatualizado · ' : 'Atualizado · '}{quando}</small>
          </div>
          <button className="botao-icone" onClick={() => void atualizar()} aria-label="Atualizar" disabled={carregando}>{carregando ? '…' : '↻'}</button>
          {erro && <p className="faixa-erro">{erro}</p>}
        </header>
        {tela}
      </main>
      <nav className="barra">
        {ABAS.map((a) => (
          <button key={a.id} className={aba === a.id && !ativo ? 'ativa' : ''} onClick={() => irPara(a.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icone} /></svg>
            <span>{a.nome}</span>
            {a.id === 'mais' && resumo.notificacoes.nao_lidas > 0 && <i className="bolinha">{resumo.notificacoes.nao_lidas}</i>}
          </button>
        ))}
      </nav>
    </div>
  )
}
