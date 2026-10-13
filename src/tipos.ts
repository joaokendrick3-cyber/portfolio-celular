// Formato do resumo que o Portfólio do computador envia (ver app/celular.py). Só os campos que o celular usa.
export interface Ativo {
  ticker: string; exibicao: string; nome: string | null; classe: string; moeda: string
  cotas: number; preco_medio: number | null; cotacao: number | null; cotacao_usd?: number | null; preco_medio_usd?: number | null; fonte: string | null
  investido: number; valor_atual: number; valorizacao: number; valorizacao_pct: number
  participacao: number; participacao_classe: number; proventos_recebidos: number; proventos_a_receber: number
}
export interface Classe { classe: string; investido: number; valor_atual: number; valorizacao: number; valorizacao_pct: number; participacao: number; proventos_recebidos: number }
export interface PontoEvolucao { data: string; valor: number; investido: number; estimado: boolean }
export interface Dashboard {
  patrimonio: number; investido: number; valorizacao: number; valorizacao_pct: number; retorno_total: number; retorno_total_pct: number
  proventos_recebidos: number; proventos_a_receber: number; dolar: { data: string; valor: number } | null
  ativos: Ativo[]; classes: Classe[]; evolucao: PontoEvolucao[]; cotacoes_origem: { fonte: string; referencia_em: string }[]
}
export interface Agenda { data: string; descricao: string; exibicao: string; ticker: string; tipo: string; referencia: string | null; link: string | null; valor?: number | null }
export interface RadarAtivo { exibicao: string; ticker: string; classe: string; resultado: number; resultado_pct: number; variacao_pct: number | null; preco_agora: number | null; preco_antes: number | null; moeda: string; compras: number; vendas: number }
export interface Radar {
  periodo: string; rotulo: string; resultado: number; resultado_pct: number; valor_antes: number | null; ativos: RadarAtivo[]
  agenda: Agenda[]; total_proventos_pagos: number; proventos_pagos: { exibicao: string; total_liquido?: number; valor?: number; pagamento?: string }[]
  novidades: number; primeira_vez: boolean
}
export interface PainelProventos {
  recebido: number; a_receber: number; media_mensal: number; recebido_12m: number; yield_on_cost_12m: number
  por_mes: { mes: string; recebido: number; a_receber: number }[]
  por_ativo: { exibicao: string; ticker: string; recebido: number; a_receber: number; yoc: number | null }[]
}
export interface Provento { ticker: string; exibicao: string; tipo: string; data_com: string | null; pagamento: string | null; quantidade: number; valor_por_cota: number; total_liquido: number; imposto: number }
export interface Lancamento { classe: string; tipo: string; ticker: string; data: string | null; cotas: number; preco_unitario: number; total: number }
export interface Evento { categoria: string; data: string; detalhe: string | null; exibicao: string; fonte: string | null; importancia: string; link: string | null; oficial: boolean; opiniao: boolean; ticker: string; titulo: string }
export interface Notificacao { id: number; categoria: string; data: string; descricao: string; exibicao: string; ticker: string; fonte: string | null; lida: boolean; link: string | null; titulo?: string; oficial?: boolean; opiniao?: boolean }
export interface Detalhe {
  ticker: string; exibicao: string; nome: string | null; classe: string; setor: string | null; em_carteira: boolean
  resumo: Ativo & { preco_medio_usd: number | null; cotacao_usd: number | null }
  historico: { data: string; tipo: string; cotas: number; preco: number; total: number; cotas_apos: number; preco_medio_apos: number | null; lucro_realizado: number | null }[]
  proventos: Provento[]; agenda: Agenda[]; eventos: Evento[]
  grafico: { moeda: string; precos: { data: string; preco: number; estimado: boolean }[]; compras: { data: string; cotas: number; preco: number }[]; preco_medio: { data: string; valor: number }[] }
  yield_on_cost: number | null; dolar_hoje: number | null
}
export interface LinhaObservacao { exibicao: string; classe: string; cotacao: number | null; justo: number | null; teto: number | null; margem_justo: number | null; margem_teto: number | null; minimo_52s: number | null; maximo_52s: number | null; distancia_maxima: number | null }
export interface Resumo {
  versaoEsquema: number; geradoEm: string; hoje: string
  dashboard: Dashboard; painelProventos: PainelProventos
  eventos: Evento[]; notificacoes: { lista: Notificacao[]; nao_lidas: number }
  radar: Record<string, Radar | null>
  lancamentos: Lancamento[]; proventos: Provento[]
  detalhes: Record<string, Detalhe>
  logos: Record<string, string>
  observacao: { linhas: LinhaObservacao[] } | null
}

export interface ResultadoIntervalo {
  inicio: string; fim: string; valor_inicio: number; valor_fim: number; diferenca: number; pct: number | null
  compras?: number; vendas?: number; estimado: boolean
}
