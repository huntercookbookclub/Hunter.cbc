import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, spring, interpolate, interpolateColors, Easing,
  useCurrentFrame, useVideoConfig, delayRender, continueRender,
} from 'remotion'

// One continuous shot, no cuts. A single "hero" shape carries the eye from scene to scene:
//   word box -> search bar -> phone (Guide) -> card (Recipe Book) -> flips (Lookback)
//   -> shrinks to a tile the wall grows out of -> tiles orbit "Made by members."
//   -> that pill morphs into the logo -> end card.
// Every timing below is a global frame at 30fps.

// Brand values lifted from src/App.css (landing page); green/yellow from the logo's burger.
const INK = '#1d1b1f'
const CORAL = '#f2665f'
const PINK = '#f06bb0'
const GREEN = '#2fb67c'
const YELLOW = '#ffc23d'
const PINK_BORDER = 'rgba(232, 72, 150, 0.29)'
const PAPER = '#fbf4f2'
const GINGHAM =
  'repeating-linear-gradient(0deg, rgba(242,102,95,.22) 0 60px, transparent 60px 120px),' +
  'repeating-linear-gradient(90deg, rgba(242,102,95,.22) 0 60px, transparent 60px 120px)'
const FONT = '"Baloo 2", sans-serif'

const font = new FontFace('Baloo 2', `url(${staticFile('Baloo2-latin.woff2')})`, { weight: '400 800' })
const fontHandle = delayRender('font')
font.load().then((f) => { document.fonts.add(f); continueRender(fontHandle) })

export const DURATION = 660

const EXPO = Easing.bezier(0.16, 1, 0.3, 1)
const tw = (f, [a, b], [x, y], easing = EXPO) =>
  interpolate(f, [a, b], [x, y], { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
const lerp = (a, b, t) => a + (b - a) * t
// Value that holds, then eases to each new target in turn: segs = [[start, end, to], ...]
const seg = (f, init, segs) => {
  let v = init
  for (const [a, b, to] of segs) { if (f <= a) break; v = lerp(v, to, tw(f, [a, b], [0, 1])) }
  return v
}
const spr = (f, fps, at, damping = 12) => spring({ frame: f - at, fps, config: { damping } })

// --- Shapes ----------------------------------------------------------------------
const Shape = ({ kind, color, size }) => {
  if (kind === 'circle') return <div style={{ width: size, height: size, borderRadius: '50%', background: color }} />
  if (kind === 'ring') return <div style={{ width: size, height: size, borderRadius: '50%', border: `${size * 0.18}px solid ${color}`, boxSizing: 'border-box' }} />
  if (kind === 'pill') return <div style={{ width: size, height: size * 0.42, borderRadius: 999, background: color }} />
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', display: 'block' }}>
      {kind === 'star' && [0, 45, 90, 135].map((a) => <rect key={a} x="41" y="0" width="18" height="100" rx="9" fill={color} transform={`rotate(${a} 50 50)`} />)}
      {kind === 'tri' && <polygon points="50,6 96,90 4,90" fill={color} stroke={color} strokeWidth="10" strokeLinejoin="round" />}
      {kind === 'squiggle' && <path d="M4 50 Q 19 14 34 50 T 64 50 T 96 50" stroke={color} strokeWidth="13" fill="none" strokeLinecap="round" />}
    </svg>
  )
}

// The same six shapes ride along the whole video; they duck out while the dark wall is up.
const FLOATERS = [
  ['star', CORAL, 60, 70, 140, 1.2], ['circle', GREEN, 900, 70, 110, 0], ['squiggle', PINK, 800, 1680, 220, 0.2],
  ['ring', YELLOW, 70, 1560, 150, 0], ['tri', INK, 950, 1470, 90, -1], ['pill', PINK, 50, 1300, 140, 0.6],
]
const Floaters = ({ f, fps }) => {
  const away = tw(f, [332, 346], [0, 1]) - tw(f, [464, 480], [0, 1])
  return FLOATERS.map(([kind, color, x, y, size, spin], i) => {
    const s = spr(f, fps, 4 + i * 3, 9) * (1 - away)
    return (
      <div key={i} style={{
        position: 'absolute', left: x, top: y,
        transform: `translate(${Math.sin(f / 40 + i) * 24}px, ${Math.cos(f / 25 + i * 2) * 20}px) rotate(${i * 40 + f * spin * 2}deg) scale(${s})`,
      }}><Shape kind={kind} color={color} size={size} /></div>
    )
  })
}

// --- Act 1: "Good food in every [box]" ----------------------------------------------
const SLOT = ['borough.', 'bite.', 'bowl.', 'friend.']
const SLOT_COLORS = [CORAL, PINK, GREEN, CORAL]
const SLOT_FONT = 130
const slotWidths = () => {
  const c = document.createElement('canvas').getContext('2d')
  c.font = `800 ${SLOT_FONT}px "Baloo 2"`
  return SLOT.map((w) => c.measureText(w).width + 90)
}

const Headline = ({ f, fps }) => {
  if (f > 80) return null
  const out = tw(f, [62, 76], [0, 1], Easing.in(Easing.cubic))
  return (
    <div style={{
      position: 'absolute', top: 560, width: '100%', textAlign: 'center', fontSize: 160, fontWeight: 800, lineHeight: 1.02,
      transform: `translateY(${-out * 260}px)`, opacity: 1 - out,
    }}>
      {[['Good', 'food'], ['in', 'every']].map((line, li) => (
        <div key={li}>
          {line.map((w, wi) => {
            const i = li * 2 + wi
            const s = spr(f, fps, i * 4, 8)
            return (
              <span key={w} style={{
                display: 'inline-block', margin: '0 18px', opacity: Math.min(1, s * 2),
                transform: `translateY(${(1 - s) * 140}px) rotate(${(1 - s) * (i % 2 ? 25 : -25)}deg) scale(${0.4 + s * 0.6})`,
              }}>{w}</span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// --- The hero shape ------------------------------------------------------------------
const QUESTION = 'where should we eat?'
const Hero = ({ f, fps }) => {
  if (f < 12 || f >= 360) return null
  const ww = slotWidths()
  const w = seg(f, ww[0], [[30, 38, ww[1]], [42, 50, ww[2]], [54, 62, ww[3]], [66, 84, 900], [122, 145, 540], [200, 222, 1000], [335, 358, 420]])
  const h = seg(f, 180, [[66, 84, 140], [122, 145, 1170], [200, 222, 625], [335, 358, 520]])
  const r = seg(f, 24, [[66, 84, 70], [200, 222, 40], [335, 358, 34]])
  const cy = seg(f, 1010, [[66, 84, 960], [122, 145, 1225], [200, 222, 1190], [335, 358, 960]])
  const fill = tw(f, [66, 80], [0, 1])
  const press = tw(f, [117, 120], [0, 1], Easing.linear) - tw(f, [120, 124], [0, 1], Easing.linear)
  const rotY = f < 281 ? tw(f, [270, 281], [0, 90], Easing.in(Easing.quad)) : tw(f, [281, 292], [-90, 0])
  const appear = spr(f, fps, 14, 11)
  const slotPos = tw(f, [30, 38], [0, 1]) + tw(f, [42, 50], [0, 1]) + tw(f, [54, 62], [0, 1])
  const chars = Math.floor(tw(f, [86, 114], [0, QUESTION.length], Easing.linear))
  const handles = 1 - tw(f, [64, 74], [0, 1])
  const img = (src, opacity) => opacity > 0 && (
    <Img src={staticFile(src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity }} />
  )
  return (
    <div style={{
      position: 'absolute', left: 540 - w / 2, top: cy - h / 2, width: w, height: h,
      transform: `perspective(2000px) rotateY(${rotY}deg) scale(${appear * (1 - press * 0.05)})`,
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: r, overflow: 'hidden',
        background: `rgba(255,255,255,${fill})`,
        boxShadow: `0 30px 80px rgba(60,20,30,${0.22 * fill}), inset 0 0 0 ${f > 124 ? 6 : 3}px ${f > 124 ? PINK_BORDER : `rgba(232,72,150,${0.18 * fill})`}`,
      }}>
        {f < 84 && (
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - tw(f, [68, 76], [0, 1]) }}>
            <div style={{ transform: `translateY(${-slotPos * 180}px)` }}>
              {SLOT.map((word, i) => (
                <div key={word} style={{ height: 180, lineHeight: '190px', textAlign: 'center', fontSize: SLOT_FONT, fontWeight: 800, color: SLOT_COLORS[i], whiteSpace: 'nowrap' }}>{word}</div>
              ))}
            </div>
          </div>
        )}
        {f >= 76 && f < 128 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 22px 0 44px', gap: 22,
            opacity: tw(f, [78, 86], [0, 1]) - tw(f, [121, 127], [0, 1]),
          }}>
            <svg width="52" height="52" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#9a8a8c" strokeWidth="2.4" />
              <path d="M15.5 15.5 L21 21" stroke="#9a8a8c" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <div style={{ flex: 1, fontSize: 54, fontWeight: 600, whiteSpace: 'nowrap', color: chars ? INK : '#b3a5a7' }}>
              {chars ? QUESTION.slice(0, chars) : 'Search CookBook Club…'}
              {chars > 0 && Math.floor(f / 8) % 2 === 0 && f < 116 && <span style={{ color: CORAL }}>|</span>}
            </div>
            <div style={{ width: 96, height: 96, flexShrink: 0, position: 'relative', transform: `rotate(${f * 9}deg)` }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 22, height: 22, borderRadius: '50%', left: 37, top: 37,
                  background: `hsl(${i * 45 + 350}, 85%, 62%)`, transform: `rotate(${i * 45}deg) translateY(-${30 + press * 10}px)`,
                }} />
              ))}
            </div>
          </div>
        )}
        {f >= 124 && f < 281 && img('map-mobile.png', tw(f, [126, 140], [0, 1]) * (1 - tw(f, [200, 214], [0, 1])))}
        {f >= 200 && f < 281 && img('recipe-book.png', tw(f, [200, 214], [0, 1]))}
        {f >= 281 && img('lookback.png', 1)}
      </div>
      {/* Selection box with corner handles: only in act 1 */}
      {handles > 0 && (
        <>
          <div style={{ position: 'absolute', inset: -6, borderRadius: r + 6, border: `5px dashed ${CORAL}`, opacity: handles }} />
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => (
            <div key={`${x}${y}`} style={{
              position: 'absolute', left: x * w - 14, top: y * h - 14, width: 28, height: 28, borderRadius: 6,
              background: '#fff', border: `5px solid ${CORAL}`, boxSizing: 'border-box', transform: `scale(${handles})`,
            }} />
          ))}
        </>
      )}
    </div>
  )
}

const Cursor = ({ f }) => {
  if (f < 88 || f > 132) return null
  const press = tw(f, [117, 120], [0, 1], Easing.linear) - tw(f, [120, 124], [0, 1], Easing.linear)
  return (
    <svg width="80" height="80" viewBox="0 0 24 24" style={{
      position: 'absolute', left: tw(f, [88, 114], [1100, 905]), top: tw(f, [88, 114], [1500, 962]),
      opacity: tw(f, [124, 132], [1, 0]), transform: `scale(${1 - press * 0.18})`,
      transformOrigin: '4px 4px', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.3))',
    }}>
      <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.5 14 L18 14 Z" fill="#fff" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

// On the click, dots spray out of the button, then get pulled onto the phone's outline as it forms.
const Sparks = ({ f }) => {
  if (f < 120 || f > 152) return null
  const out = tw(f, [120, 131], [0, 1]), pull = tw(f, [131, 146], [0, 1]), fade = tw(f, [144, 152], [1, 0])
  return Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2
    const sx = 920 + Math.cos(a) * (140 + (i % 3) * 90) * out, sy = 960 + Math.sin(a) * (140 + (i % 3) * 90) * out
    // matching point on the phone's outline (x 270..810, y 640..1810)
    const p = i / 30, per = 2 * (540 + 1170), d = p * per
    const [tx, ty] = d < 540 ? [270 + d, 640] : d < 1710 ? [810, 640 + d - 540] : d < 2250 ? [810 - (d - 1710), 1810] : [270, 1810 - (d - 2250)]
    return (
      <div key={i} style={{
        position: 'absolute', left: lerp(sx, tx, pull) - 12, top: lerp(sy, ty, pull) - 12, width: 24, height: 24,
        borderRadius: '50%', background: [CORAL, PINK, GREEN, YELLOW][i % 4], opacity: fade,
      }} />
    )
  })
}

// --- Labels above the hero while it shows the three pages ----------------------------
const FEATURES = [
  { label: 'The CookBook Guide', sub: 'Spots our members swear by', on: [146, 200] },
  { label: 'The Recipe Book', sub: 'Cook what the club cooks', on: [212, 270] },
  { label: 'The Big Back Lookback', sub: 'Every outing, one pinboard', on: [282, 335] },
]
const Labels = ({ f }) => {
  if (f < 134 || f > 348) return null
  const active = tw(f, [200, 212], [0, 1]) + tw(f, [270, 282], [0, 1])
  const vis = tw(f, [134, 148], [0, 1]) - tw(f, [333, 345], [0, 1])
  return (
    <div style={{ opacity: vis, transform: `translateY(${(1 - vis) * -60}px)` }}>
      <div style={{ position: 'absolute', top: 200, left: 0, right: 0, height: 300, overflow: 'hidden' }}>
        <div style={{ transform: `translateY(${120 - active * 96}px)` }}>
          {FEATURES.map((ft, i) => {
            const d = Math.abs(active - i)
            return (
              <div key={ft.label} style={{
                height: 96, textAlign: 'center', fontSize: 82, fontWeight: 800,
                opacity: Math.max(0.15, 1 - d * 0.8), transform: `scale(${1 - Math.min(d, 1) * 0.22})`,
              }}>{ft.label}</div>
            )
          })}
        </div>
      </div>
      {FEATURES.map((ft, i) => {
        const o = tw(f, [ft.on[0], ft.on[0] + 10], [0, 1]) - tw(f, [ft.on[1] - 4, ft.on[1] + 4], [0, 1])
        return o > 0 && (
          <div key={i} style={{
            position: 'absolute', top: 525, width: '100%', textAlign: 'center', fontSize: 48, fontWeight: 600,
            color: '#6b5a5c', opacity: o, transform: `translateY(${(1 - o) * 20}px)`,
          }}>{ft.sub}</div>
        )
      })}
    </div>
  )
}

// --- Act 3: the wall grows out of the hero tile, then nine tiles orbit the pill -------
const TILE_SRC = [
  ['map-place.png', '35% 50%'], ['recipe-book.png', '72% 45%'], ['lookback.png', '18% 45%'],
  ['cbcpic.jpg', 'center'], ['map-dark.png', '50% 50%'], ['lookback.png', '55% 45%'],
  ['landing.png', '50% 30%'], ['recipe-book.png', '28% 50%'], ['map-mobile.png', '50% 15%'],
  ['lookback.png', '78% 45%'],
]
const GRID = []
for (let c = 0; c < 5; c++) for (let r = -3; r <= 3; r++) {
  GRID.push({ c, r, src: c === 2 && r === 0 ? ['lookback.png', 'center'] : TILE_SRC[(c * 3 + r + 3) % TILE_SRC.length] })
}
const wallPos = (c, r, f) => {
  const scroll = (c % 2 ? 1 : -1) * Math.max(0, f - 372) * 12
  const x0 = (c - 2) * 450, y0 = r * 550 + scroll
  const deg = tw(f, [362, 392], [0, -14]), A = (deg * Math.PI) / 180, S = tw(f, [362, 392], [1, 0.92])
  return { x: 540 + (x0 * Math.cos(A) - y0 * Math.sin(A)) * S, y: 960 + (x0 * Math.sin(A) + y0 * Math.cos(A)) * S, rot: deg, s: S }
}
// The nine tiles nearest the centre when the orbit starts join it, ordered by angle so paths don't cross.
const ORBIT = GRID
  .map((t, i) => ({ i, p: wallPos(t.c, t.r, 440) }))
  .sort((a, b) => Math.hypot(a.p.x - 540, a.p.y - 960) - Math.hypot(b.p.x - 540, b.p.y - 960))
  .slice(0, 9)
  .sort((a, b) => Math.atan2(a.p.y - 960, a.p.x - 540) - Math.atan2(b.p.y - 960, b.p.x - 540))
  .reduce((m, { i }, k) => m.set(i, k), new Map())

const Tiles = ({ f, fps }) => {
  if (f < 346 || f > 534) return null
  const toOrbit = tw(f, [440, 464], [0, 1])
  const collapse = tw(f, [510, 530], [0, 1], Easing.in(Easing.cubic))
  return GRID.map((t, i) => {
    const centre = t.c === 2 && t.r === 0
    if (centre && f < 358) return null
    const wp = wallPos(t.c, t.r, f)
    const grow = centre ? 1 : spr(f, fps, 348 + (Math.abs(t.c - 2) + Math.abs(t.r)) * 2, 13)
    let x = lerp(540, wp.x, grow), y = lerp(960, wp.y, grow), s = wp.s * grow, rot = wp.rot, opacity = 1
    const k = ORBIT.get(i)
    if (k === undefined) {
      x = lerp(x, 540 + (wp.x - 540) * 2.4, toOrbit); y = lerp(y, 960 + (wp.y - 960) * 2.4, toOrbit); opacity = 1 - toOrbit
    } else {
      const a = ((k * 40 - 90 + (f - 440) * 1.5) * Math.PI) / 180
      const R = 1 - collapse
      x = lerp(x, 540 + Math.cos(a) * 390 * R, toOrbit)
      y = lerp(y, 960 + Math.sin(a) * 560 * R, toOrbit)
      s = lerp(s, 0.5 * (1 - collapse * 0.8), toOrbit)
      rot = lerp(rot, Math.sin(f / 10 + k) * 8, toOrbit)
    }
    if (opacity <= 0) return null
    return (
      <Img key={i} src={staticFile(t.src[0])} style={{
        position: 'absolute', left: x - 210, top: y - 260, width: 420, height: 520, borderRadius: 34,
        objectFit: 'cover', objectPosition: t.src[1], opacity: opacity * (1 - tw(f, [526, 534], [0, 1])),
        transform: `rotate(${rot}deg) scale(${s})`, boxShadow: toOrbit > 0 ? `0 20px 50px rgba(60,20,30,${0.25 * toOrbit})` : 'none',
      }} />
    )
  })
}

// --- Act 4: the pill stays put through the wall -> orbit change, then becomes the logo ---
const NAME = 'CookBook Club'
const PillToLogo = ({ f, fps }) => {
  if (f < 378) return null
  const pop = spr(f, fps, 380, 9)
  const morph = tw(f, [512, 530], [0, 1])
  const w = lerp(780, 440, morph), h = lerp(150, 440, morph)
  const cy = seg(f, 960, [[545, 565, 640]])
  const logo = tw(f, [524, 540], [0, 1])
  return (
    <div style={{
      position: 'absolute', left: 540 - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: Math.min(w, h) / 2,
      background: interpolateColors(morph, [0, 1], ['#ffffff', CORAL]), overflow: 'hidden',
      transform: `scale(${pop}) rotate(${(1 - pop) * -30 + morph * (1 - logo) * 25}deg)`,
      boxShadow: `0 0 0 ${logo * 14}px #fff, 0 0 0 ${logo * 22}px ${PINK_BORDER}, 0 30px 80px rgba(0,0,0,.3)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 92, fontWeight: 800, whiteSpace: 'nowrap', opacity: 1 - tw(f, [508, 516], [0, 1]) }}>Made by members.</div>
      {logo > 0 && <Img src={staticFile('cbcpic.jpg')} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: logo,
        transform: `scale(${0.6 + logo * 0.4}) rotate(${(1 - logo) * -40}deg)`,
      }} />}
    </div>
  )
}

const EndCard = ({ f, fps }) => {
  if (f < 550) return null
  const chars = Math.floor(tw(f, [552, 576], [0, NAME.length], Easing.linear))
  const url = spr(f, fps, 582, 9)
  const ig = tw(f, [596, 608], [0, 1])
  return (
    <div style={{ position: 'absolute', top: 920, width: '100%', textAlign: 'center' }}>
      <div style={{ fontSize: 150, fontWeight: 800, height: 170 }}>
        {NAME.slice(0, chars)}
        {chars > 0 && chars < NAME.length && <span style={{ color: CORAL }}>|</span>}
      </div>
      <div style={{
        display: 'inline-block', marginTop: 40, background: CORAL, color: '#fff', fontSize: 78, fontWeight: 800,
        padding: '14px 56px', borderRadius: 999, transform: `scale(${url}) rotate(${(1 - url) * 12}deg)`,
      }}>cookbookclub.nyc</div>
      <div style={{ fontSize: 56, fontWeight: 700, marginTop: 34, opacity: ig, transform: `translateY(${(1 - ig) * 30}px)` }}>
        @hunter.cbc on Instagram
      </div>
    </div>
  )
}

const Scene = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const dark = tw(f, [338, 358], [0, 1]) - tw(f, [446, 464], [0, 1])
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: FONT, color: INK, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: INK, opacity: dark }} />
      <AbsoluteFill style={{ background: GINGHAM, opacity: tw(f, [545, 575], [0, 0.6]) }} />
      <Floaters f={f} fps={fps} />
      <Headline f={f} fps={fps} />
      <Labels f={f} />
      <Sparks f={f} />
      <Hero f={f} fps={fps} />
      <Tiles f={f} fps={fps} />
      <PillToLogo f={f} fps={fps} />
      <EndCard f={f} fps={fps} />
      <Cursor f={f} />
    </AbsoluteFill>
  )
}

// Sound cues: [frame, file in public/sfx, volume, optional length in frames].
// Files come from scripts/make-audio.mjs; drop in real SFX with the same names to replace them.
const CUES = [
  [0, 'pop', 0.45], [4, 'pop', 0.45], [8, 'pop', 0.45], [12, 'pop', 0.45], [14, 'click', 0.5],
  [30, 'tick', 0.5], [42, 'tick', 0.5], [54, 'tick', 0.5], [66, 'whoosh', 0.6], [86, 'typing', 0.6],
  [119, 'click', 0.9], [120, 'burst', 0.5], [123, 'whoosh-big', 0.6],
  [200, 'whoosh', 0.6], [270, 'whoosh', 0.5], [281, 'tick', 0.5],
  [335, 'whoosh', 0.6], [346, 'burst', 0.6], [380, 'pop', 0.7],
  [440, 'whoosh-big', 0.7], [510, 'whoosh', 0.6], [526, 'chime', 0.6],
  [552, 'typing', 0.5, 24], [582, 'pop', 0.7], [596, 'tick', 0.5],
]

export const Promo = () => (
  <AbsoluteFill>
    <Scene />
    <Audio src={staticFile('sfx/music.wav')}
      volume={(f) => interpolate(f, [0, 10, DURATION - 30, DURATION], [0, 0.4, 0.4, 0], { extrapolateRight: 'clamp' })} />
    {CUES.map(([at, name, volume, clip], i) => (
      <Sequence key={i} from={at} durationInFrames={clip}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
)
