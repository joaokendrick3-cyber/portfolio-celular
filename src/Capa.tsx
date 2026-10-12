import { useEffect, useRef } from 'react'
import './capa.css'

// Capa de abertura igual à do computador: fundo preto de bolinhas brancas que reagem ao dedo, título que ondula,
// frases digitadas e o controle "deslize para entrar". Portada de Portfólio/app/interface/capa.js.

const CFG = {
  espaco: 13,        // distância entre as bolinhas
  raioBase: 0.8,     // tamanho da bolinha apagada
  raioMax: 2.6,      // tamanho da bolinha acesa
  tomBase: 30,       // cor da bolinha apagada (0 = preto, 255 = branco)
  tomMax: 150,       // cor da bolinha acesa
  alcance: 95,       // raio da área que o dedo acende
  desvanecer: 0.95,  // duração do rastro
  repulsao: 10       // quanto as bolinhas fogem do dedo
}
const FRASES = ['Seu portfólio de investimentos', 'Carteira · Proventos · Eventos', 'Dados oficiais da B3 e da CVM', 'Sua carteira em um só lugar']
const TITULO = 'PORTFÓLIO'
const NIVEIS = 28
const LIMIAR = 0.88 // passou de 88% do caminho: entra

export default function Capa({ onFim }: { onFim: () => void }) {
  const capaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textoRef = useRef<HTMLSpanElement>(null)
  const controleRef = useRef<HTMLDivElement>(null)
  const bolaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const capa = capaRef.current!
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const alvoTexto = textoRef.current!
    const controle = controleRef.current!
    const bola = bolaRef.current!
    const reduzirMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches
    document.body.classList.add('na-capa')

    let largura = 0, altura = 0, colunas = 0, linhas = 0, offX = 0, offY = 0, total = 0
    let px = new Float32Array(0), py = new Float32Array(0), dx = new Float32Array(0), dy = new Float32Array(0)
    let vx = new Float32Array(0), vy = new Float32Array(0), brilho = new Float32Array(0), balde = new Uint8Array(0)
    const dedo = { x: -9999, y: -9999, antX: -9999, antY: -9999, ultimoMov: 0 }
    const ondas: { x: number; y: number; inicio: number; forca: number }[] = []
    let animando = true
    const timers: number[] = []
    let raf = 0

    function montarGrade(): void {
      const dpr = window.devicePixelRatio || 1
      largura = window.innerWidth
      altura = window.innerHeight
      canvas.width = largura * dpr
      canvas.height = altura * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      colunas = Math.ceil(largura / CFG.espaco) + 1
      linhas = Math.ceil(altura / CFG.espaco) + 1
      offX = (largura - (colunas - 1) * CFG.espaco) / 2
      offY = (altura - (linhas - 1) * CFG.espaco) / 2
      total = colunas * linhas
      px = new Float32Array(total); py = new Float32Array(total)
      dx = new Float32Array(total); dy = new Float32Array(total)
      vx = new Float32Array(total); vy = new Float32Array(total)
      brilho = new Float32Array(total); balde = new Uint8Array(total)
      for (let i = 0; i < colunas; i++) {
        for (let j = 0; j < linhas; j++) {
          const k = i * linhas + j
          px[k] = offX + i * CFG.espaco
          py[k] = offY + j * CFG.espaco
        }
      }
    }

    function acender(x: number, y: number, empurrar: boolean): void {
      const R = CFG.alcance
      const i1 = Math.max(0, Math.floor((x - R - offX) / CFG.espaco))
      const i2 = Math.min(colunas - 1, Math.ceil((x + R - offX) / CFG.espaco))
      const j1 = Math.max(0, Math.floor((y - R - offY) / CFG.espaco))
      const j2 = Math.min(linhas - 1, Math.ceil((y + R - offY) / CFG.espaco))
      for (let i = i1; i <= i2; i++) {
        for (let j = j1; j <= j2; j++) {
          const k = i * linhas + j
          const ddx = px[k] - x, ddy = py[k] - y
          const d = Math.hypot(ddx, ddy)
          if (d >= R) continue
          const f = 1 - d / R
          brilho[k] = Math.max(brilho[k], f * f)
          if (empurrar && d > 0.001) {
            const forca = f * f * CFG.repulsao * 0.08
            vx[k] += (ddx / d) * forca
            vy[k] += (ddy / d) * forca
          }
        }
      }
    }

    function novaOnda(x: number, y: number, forca = 1): void {
      ondas.push({ x, y, inicio: performance.now(), forca })
      if (ondas.length > 6) ondas.shift()
    }

    const contagem = new Uint32Array(NIVEIS + 1)
    let ordem = new Uint32Array(0)

    function quadro(agora: number): void {
      if (!animando) return
      const t = agora / 1000
      if (dedo.antX > -9000) {
        const dist = Math.hypot(dedo.x - dedo.antX, dedo.y - dedo.antY)
        const passos = Math.max(1, Math.ceil(dist / 12))
        for (let s = 1; s <= passos; s++) {
          acender(dedo.antX + (dedo.x - dedo.antX) * (s / passos), dedo.antY + (dedo.y - dedo.antY) * (s / passos), s === passos && dist > 0.5)
        }
      }
      dedo.antX = dedo.x
      dedo.antY = dedo.y

      for (let o = ondas.length - 1; o >= 0; o--) {
        const onda = ondas[o]
        const idade = agora - onda.inicio
        if (idade > 2200) { ondas.splice(o, 1); continue }
        const raio = idade * 0.55
        const intensidade = (1 - idade / 2200) * onda.forca
        for (let k = 0; k < total; k++) {
          const ddx = px[k] - onda.x, ddy = py[k] - onda.y
          const d = Math.hypot(ddx, ddy)
          const faixa = Math.abs(d - raio)
          if (faixa < 30) {
            const f = (1 - faixa / 30) * intensidade
            brilho[k] = Math.max(brilho[k], f * 0.9)
            if (d > 0.001) { vx[k] += (ddx / d) * f * 0.35; vy[k] += (ddy / d) * f * 0.35 }
          }
        }
      }

      if (!reduzirMovimento && agora - dedo.ultimoMov > 3500 && Math.random() < 0.006) novaOnda(Math.random() * largura, Math.random() * altura, 0.6)
      for (let s = 0; s < 3; s++) {
        const k = (Math.random() * total) | 0
        brilho[k] = Math.max(brilho[k], 0.35 + Math.random() * 0.4)
      }

      contagem.fill(0)
      for (let k = 0; k < total; k++) {
        vx[k] += -dx[k] * 0.06; vy[k] += -dy[k] * 0.06
        vx[k] *= 0.82; vy[k] *= 0.82
        dx[k] += vx[k]; dy[k] += vy[k]
        brilho[k] *= CFG.desvanecer
        if (brilho[k] < 0.003) brilho[k] = 0
        let amb = 0
        if (!reduzirMovimento) {
          const w = Math.sin(px[k] * 0.009 + t * 0.7) * Math.sin(py[k] * 0.011 - t * 0.5)
          amb = w > 0 ? w * w * w * 0.22 : 0
        }
        const b = Math.round(Math.min(1, brilho[k] + amb) * (NIVEIS - 1))
        balde[k] = b
        contagem[b]++
      }

      if (ordem.length !== total) ordem = new Uint32Array(total)
      const inicio = new Uint32Array(NIVEIS + 1)
      for (let b = 1; b <= NIVEIS; b++) inicio[b] = inicio[b - 1] + contagem[b - 1]
      const cursor = inicio.slice()
      for (let k = 0; k < total; k++) ordem[cursor[balde[k]]++] = k

      ctx.clearRect(0, 0, largura, altura)
      for (let b = 0; b < NIVEIS; b++) {
        const n = contagem[b]
        if (!n) continue
        const nivel = b / (NIVEIS - 1)
        const tom = Math.round(CFG.tomBase + (CFG.tomMax - CFG.tomBase) * nivel)
        const r = CFG.raioBase + (CFG.raioMax - CFG.raioBase) * nivel
        ctx.beginPath()
        for (let q = inicio[b]; q < inicio[b] + n; q++) {
          const k = ordem[q]
          const x = px[k] + dx[k], y = py[k] + dy[k]
          if (r < 1.2) ctx.rect(x - r, y - r, r * 2, r * 2)
          else { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2) }
        }
        ctx.fillStyle = `rgb(${tom},${tom},${tom})`
        ctx.fill()
      }
      raf = requestAnimationFrame(quadro)
    }

    // dedo (ou mouse) no fundo
    function mover(x: number, y: number): void {
      if (dedo.antX < -9000) { dedo.antX = x; dedo.antY = y }
      dedo.x = x; dedo.y = y
      dedo.ultimoMov = performance.now()
    }
    const aoMover = (e: PointerEvent): void => mover(e.clientX, e.clientY)
    const aoSair = (): void => { dedo.x = dedo.antX = -9999 }
    const aoTocar = (e: PointerEvent): void => {
      if (!(e.target as HTMLElement).closest('.deslizar')) { novaOnda(e.clientX, e.clientY); mover(e.clientX, e.clientY) }
    }
    capa.addEventListener('pointermove', aoMover)
    capa.addEventListener('pointerleave', aoSair)
    capa.addEventListener('pointerup', aoSair)
    capa.addEventListener('pointerdown', aoTocar)
    let esperaResize = 0
    const aoRedimensionar = (): void => {
      if (!animando) return
      clearTimeout(esperaResize)
      esperaResize = window.setTimeout(montarGrade, 120)
    }
    window.addEventListener('resize', aoRedimensionar)

    // frases digitadas
    let fraseAtual = 0, letraAtual = 0, apagando = false
    function digitar(): void {
      if (!animando) return
      const frase = FRASES[fraseAtual]
      if (!apagando) {
        letraAtual++
        if (letraAtual > frase.length) { apagando = true; timers.push(window.setTimeout(digitar, 2200)); return }
      } else {
        letraAtual--
        if (letraAtual === 0) { apagando = false; fraseAtual = (fraseAtual + 1) % FRASES.length }
      }
      alvoTexto.textContent = frase.slice(0, letraAtual)
      timers.push(window.setTimeout(digitar, apagando ? 28 : 60))
    }

    // deslize para entrar
    let arrasto: { inicioX: number } | null = null
    let x = 0
    let entrou = false
    const maximo = (): number => controle.clientWidth - bola.offsetWidth - (controle.clientHeight - bola.offsetHeight) - 2
    function posicionar(novoX: number): void {
      const max = maximo()
      x = Math.max(0, Math.min(max, novoX))
      controle.style.setProperty('--x', `${x}px`)
      controle.style.setProperty('--progresso', (x / max).toFixed(3))
    }
    function entrar(): void {
      if (entrou) return
      entrou = true
      controle.classList.add('completando')
      posicionar(maximo())
      animando = false
      timers.push(window.setTimeout(() => {
        document.body.classList.add('entrando')
        void capa.offsetWidth
        capa.classList.add('saindo')
        document.body.classList.remove('na-capa')
      }, 220))
      timers.push(window.setTimeout(() => {
        document.body.classList.remove('entrando')
        onFim()
      }, 1400))
    }
    const aoSegurar = (e: PointerEvent): void => {
      arrasto = { inicioX: e.clientX - x }
      try { bola.setPointerCapture(e.pointerId) } catch { /* sem captura: o arrasto ainda funciona dentro da bola */ }
      controle.classList.add('arrastando')
      controle.classList.remove('voltando')
    }
    const aoArrastar = (e: PointerEvent): void => {
      if (!arrasto) return
      posicionar(e.clientX - arrasto.inicioX)
      const r = bola.getBoundingClientRect()
      acender(r.left + bola.offsetWidth / 2, r.top + bola.offsetHeight / 2, true)
    }
    const soltar = (): void => {
      if (!arrasto) return
      arrasto = null
      controle.classList.remove('arrastando')
      if (x >= maximo() * LIMIAR) entrar()
      else { controle.classList.add('voltando'); posicionar(0) }
    }
    const aoTeclar = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); entrar() }
    }
    bola.addEventListener('pointerdown', aoSegurar)
    bola.addEventListener('pointermove', aoArrastar)
    bola.addEventListener('pointerup', soltar)
    bola.addEventListener('pointercancel', soltar)
    bola.addEventListener('keydown', aoTeclar)

    void document.fonts.ready.then(() => {
      montarGrade()
      novaOnda(largura / 2, altura / 2, 1)
      timers.push(window.setTimeout(digitar, 900))
      raf = requestAnimationFrame(quadro)
    })

    return () => {
      animando = false
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      clearTimeout(esperaResize)
      window.removeEventListener('resize', aoRedimensionar)
      document.body.classList.remove('na-capa', 'entrando')
    }
  }, [onFim])

  return (
    <div ref={capaRef} className="capa" role="dialog" aria-label="Abertura do Portfólio">
      <canvas ref={canvasRef} id="fundo" />
      <div className="capa-conteudo">
        <h1 className="titulo" aria-label={TITULO}>
          {[...TITULO].map((l, i) => (
            <span key={i} className="letra" style={{ ['--i' as string]: i }} onPointerDown={(e) => { const el = e.currentTarget; el.classList.add('toque'); setTimeout(() => el.classList.remove('toque'), 350) }}>{l}</span>
          ))}
        </h1>
        <p className="subtitulo"><span ref={textoRef} /><span className="cursor">|</span></p>
        <div ref={controleRef} className="deslizar">
          <div className="deslizar-trilha" />
          <span className="deslizar-texto">deslize para entrar</span>
          <button ref={bolaRef} className="deslizar-bola" aria-label="Arraste para a direita para entrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
