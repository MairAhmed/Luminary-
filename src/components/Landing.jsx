import { useEffect, useRef, useState } from 'react'

export default function Landing({ onEnter }) {
  const canvasRef = useRef(null)
  const [soundOn, setSoundOn] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [inkExpand, setInkExpand] = useState(false)
  const audioRef = useRef({})
  const starsRef = useRef([])
  const animRef = useRef(null)
  const soundStartedRef = useRef(false)

  // ── Star field
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W, H

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    function makeStars() {
      starsRef.current = Array.from({ length: 220 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.2 + 0.2,
        alpha: Math.random() * 0.7 + 0.1,
        speed: Math.random() * 0.18 + 0.04,
        drift: (Math.random() - 0.5) * 0.12,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleDir: 1,
        gold: Math.random() < 0.08,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      starsRef.current.forEach(s => {
        ctx.save()
        ctx.globalAlpha = s.alpha
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.gold ? '#c9960c' : '#f0e0c0'
        ctx.shadowColor = s.gold ? '#c9960c' : '#f0e0c0'
        ctx.shadowBlur = s.gold ? 8 : 3
        ctx.fill()
        ctx.restore()
        s.alpha += s.twinkleSpeed * s.twinkleDir
        if (s.alpha > 0.9 || s.alpha < 0.05) s.twinkleDir *= -1
        s.y -= s.speed; s.x += s.drift
        if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W }
        if (s.x < -2) s.x = W + 2
        if (s.x > W + 2) s.x = -2
      })
      animRef.current = requestAnimationFrame(draw)
    }

    resize(); makeStars(); draw()
    window.addEventListener('resize', () => { resize(); makeStars() })
    return () => { cancelAnimationFrame(animRef.current) }
  }, [])

  // ── Auto-start sound on first interaction
  useEffect(() => {
    const handler = () => {
      if (soundStartedRef.current) return
      soundStartedRef.current = true
      setSoundOn(true)
      startAmbient()
    }
    window.addEventListener('mousemove', handler, { once: true })
    window.addEventListener('touchstart', handler, { once: true })
    return () => { window.removeEventListener('mousemove', handler) }
  }, [])

  function getCtx() {
    if (!audioRef.current.ctx) {
      audioRef.current.ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioRef.current.ctx
  }

  function startAmbient() {
    const ctx = getCtx()
    ctx.resume()
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 3)
    master.connect(ctx.destination)

    ;[{ f: 42, t: 'sine', g: 0.6 }, { f: 84.2, t: 'triangle', g: 0.3 }, { f: 168.6, t: 'sine', g: 0.12 }].forEach(({ f, t, g }) => {
      const o = ctx.createOscillator(); o.type = t; o.frequency.value = f
      const og = ctx.createGain(); og.gain.value = g
      o.connect(og); og.connect(master); o.start()
    })

    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08
    const lg = ctx.createGain(); lg.gain.value = 1.4
    lfo.connect(lg); lfo.start()

    audioRef.current.master = master
    audioRef.current.ambient = true

    // Schedule chimes
    scheduleChime(ctx, master)
  }

  function scheduleChime(ctx, master) {
    const delay = 4000 + Math.random() * 8000
    audioRef.current.chimeTimer = setTimeout(() => {
      if (!audioRef.current.ambient) return
      const notes = [523.25, 587.33, 659.25, 783.99, 880]
      const freq = notes[Math.floor(Math.random() * notes.length)]
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8)
      o.connect(g); g.connect(master)
      o.start(); o.stop(ctx.currentTime + 1.9)
      scheduleChime(ctx, master)
    }, delay)
  }

  function stopAmbient() {
    if (audioRef.current.master) {
      const ctx = audioRef.current.ctx
      audioRef.current.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
      audioRef.current.ambient = false
      clearTimeout(audioRef.current.chimeTimer)
    }
  }

  function playInkDrop() {
    const ctx = getCtx(); ctx.resume()
    const o = ctx.createOscillator(); o.type = 'sine'
    o.frequency.setValueAtTime(120, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.5, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.36)
  }

  function handleToggleSound() {
    if (!soundOn) {
      setSoundOn(true); startAmbient()
    } else {
      setSoundOn(false); stopAmbient()
    }
  }

  function handleEnter() {
    playInkDrop()
    setInkExpand(true)
    setTimeout(() => setExiting(true), 500)
    setTimeout(() => { stopAmbient(); onEnter() }, 1200)
  }

  return (
    <div className={`landing${exiting ? ' exit' : ''}`}>
      <canvas ref={canvasRef} id="star-canvas" />
      <div className={`ink-blot${inkExpand ? ' expand' : ''}`} />

      <button className={`sound-toggle${soundOn ? ' active' : ''}`} onClick={handleToggleSound}>
        <span>{soundOn ? '🔊' : '🔇'}</span>
        <span className="label">{soundOn ? 'Sound On' : 'Sound Off'}</span>
      </button>

      <div className="landing-content">
        <div className="landing-eyebrow">Est. Today &nbsp;·&nbsp; A Space to Reflect</div>
        <div className="landing-ornament">✦</div>
        <h1 className="landing-title">Luminary<em>Journal</em></h1>
        <div className="landing-rule"><span style={{ color: '#c9960c', fontSize: 10 }}>◆</span></div>
        <p className="landing-subtitle">Write freely. Understand deeply.<br />Your AI companion listens between the lines.</p>
        <button className="landing-cta" onClick={handleEnter}>
          <span>Open Your Journal</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="landing-footer">Your words. Your space. Always private.</div>
    </div>
  )
}
