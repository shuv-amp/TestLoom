<template>
  <div ref="pageEl" class="page">
    <header class="header">
      <div class="container nav">
        <NuxtLink to="/" class="brand" aria-label="TestLoom home">
          <span class="brand-mark" aria-hidden="true">
            <svg class="tl" width="28" height="28" viewBox="0 0 64 64" fill="none" role="img" aria-label="TL monogram">
              <defs>
                <linearGradient id="gTL" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop :stop-color="brand1" offset="0"/>
                  <stop :stop-color="brand2" offset="1"/>
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#gTL)" opacity=".18"/>
              <rect x="4.5" y="4.5" width="55" height="55" rx="15.5" stroke="url(#gTL)" opacity=".35"/>
              <path d="M10 16H54V24H38V52H26V24H10V16Z" fill="url(#gTL)"/>
              <path d="M38 52V24H46V44H54V52H38Z" fill="url(#gTL)" opacity=".8"/>
            </svg>
          </span>
          <span class="brand-text">TestLoom</span>
        </NuxtLink>

        <nav class="links" aria-label="Primary">
          <NuxtLink to="#features">Features</NuxtLink>
          <NuxtLink to="#how">Workflow</NuxtLink>
        </nav>

        <div class="actions">
          <NuxtLink to="/login" class="btn btn-ghost" aria-label="Log in to TestLoom">Log in</NuxtLink>
          <NuxtLink to="/signup" class="btn btn-primary" aria-label="Sign up for TestLoom">Sign up</NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="grid" aria-hidden="true"></div>
        <div class="container hero-grid">
          <div class="hero-copy">
            <h1 class="h1">Centralized, collaborative, and adaptive exam practice.</h1>
            <p class="lead">
              Organize past papers, convert images to MCQs with OCR, practice timed adaptive quizzes,
              and discuss in real time—beautifully integrated in one place.
            </p>
            <div class="cta-row">
              <NuxtLink to="/signup" class="btn btn-primary btn-lg">Start practicing</NuxtLink>
              <NuxtLink to="#upload" class="btn btn-dark btn-lg">Upload paper</NuxtLink>
            </div>

          </div>

          <div class="hero-visual">
            <div class="glass-card">
              <div class="glass-head">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
                <span class="glass-title">Adaptive Quiz — Algorithms</span>
              </div>
              <div class="glass-body">
                <div class="quiz-row">
                  <div class="q">Which data structure is ideal for BFS?</div>
                  <div class="opts">
                    <button class="opt" type="button">Stack</button>
                    <button class="opt is-correct" type="button">Queue</button>
                    <button class="opt" type="button">Tree</button>
                    <button class="opt" type="button">Heap</button>
                  </div>
                </div>
                <div class="progress"><div class="bar" style="width: 68%"></div></div>
                <div class="stats">
                  <div><span class="stat">00:32</span><span class="muted">time</span></div>
                  <div><span class="stat">81%</span><span class="muted">accuracy</span></div>
                  <div><span class="stat">Med</span><span class="muted">difficulty</span></div>
                </div>
              </div>
            </div>
            <div class="orb orb-1" aria-hidden="true"></div>
            <div class="orb orb-2" aria-hidden="true"></div>
          </div>
        </div>
      </section>

      <section id="features" class="section">
        <div class="container">
          <header class="section-head">
            <div>
              <span class="kicker">Why TestLoom</span>
              <h2 class="h2">Everything you need to ace exams</h2>
            </div>
            <NuxtLink to="#docs" class="btn btn-chip">Read the docs</NuxtLink>
          </header>

          <div class="cards">
            <article class="card" tabindex="0">
              <div class="icon icon-1" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="3" width="3.5" height="18" rx="1" stroke="currentColor" stroke-width="2"/>
                  <rect x="10.25" y="5" width="3.5" height="16" rx="1" stroke="currentColor" stroke-width="2"/>
                  <rect x="15.5" y="7" width="3.5" height="14" rx="1" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <h3>Structured question bank</h3>
              <p>Searchable MCQs and fill‑ins by semester, subject, and chapter.</p>
            </article>

            <article class="card" tabindex="0">
              <div class="icon icon-2" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <rect x="7" y="8" width="10" height="8" rx="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M9.5 10.5h6M9.5 13.5h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3>OCR to quiz</h3>
              <p id="upload">Upload images/PDFs—Tesseract.js converts them into quiz‑ready items.</p>
            </article>

            <article class="card" tabindex="0">
              <div class="icon icon-3" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 7v5l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M16.5 4.5l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3>Timed & adaptive</h3>
              <p>Auto‑adjusting difficulty with realistic timers to build accuracy and pacing.</p>
            </article>

            <article class="card" tabindex="0">
              <div class="icon icon-4" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-5 4V8a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <circle cx="9" cy="11" r="1" fill="currentColor"/>
                  <circle cx="13" cy="11" r="1" fill="currentColor"/>
                  <circle cx="17" cy="11" r="1" fill="currentColor"/>
                </svg>
              </div>
              <h3>Real‑time discussions</h3>
              <p>Socket.IO chat and threads to resolve doubts with peers and mentors.</p>
            </article>

            <article class="card" tabindex="0">
              <div class="icon icon-5" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l8 4v6c0 4-3.5 6-8 8-4.5-2-8-4-8-8V7l8-4z" stroke="currentColor" stroke-width="2"/>
                  <path d="M9.5 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3>Role‑based security</h3>
              <p>JWT auth with admin/moderator roles and verified uploads.</p>
            </article>

            <article class="card" tabindex="0">
              <div class="icon icon-6" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M4 17V7M10 17V5M16 17v-7M20 17V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M4 17h16" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <h3>Analytics</h3>
              <p>Topic‑wise insights on accuracy, speed, and strengths/weaknesses.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="how" class="section section-alt">
        <div class="container">
          <header class="section-head">
            <div>
              <span class="kicker">Workflow</span>
              <h2 class="h2">From paper to practice in minutes</h2>
              <p class="section-lead">A refined, visual flow of each step.</p>
            </div>
          </header>

          <div class="flow">
            <ol class="timeline" aria-label="Workflow steps">
              <li class="t-item">
                <div class="node">1</div>
                <div class="t-content">
                  <h4>Upload</h4>
                  <p>Import images or PDFs of past exam papers.</p>
                </div>
              </li>
              <li class="t-item">
                <div class="node">2</div>
                <div class="t-content">
                  <h4>Extract</h4>
                  <p>OCR reads content, detects MCQs and blanks, and cleans noise.</p>
                </div>
              </li>
              <li class="t-item">
                <div class="node">3</div>
                <div class="t-content">
                  <h4>Organize</h4>
                  <p>Tagged by subject, chapter, difficulty, and semester for instant retrieval.</p>
                </div>
              </li>
              <li class="t-item">
                <div class="node">4</div>
                <div class="t-content">
                  <h4>Practice</h4>
                  <p>Adaptive, timed quizzes with instant feedback and explanations.</p>
                </div>
              </li>
              <li class="t-item">
                <div class="node">5</div>
                <div class="t-content">
                  <h4>Discuss & improve</h4>
                  <p>Join live threads, share solutions, and track analytics to close gaps.</p>
                </div>
              </li>
            </ol>

            <div class="flow-previews">
              <div class="panel p-drop">
                <div class="p-head">
                  <span class="p-title">Upload paper</span>
                </div>
                <div class="dropzone">
                  <div class="dz-icon">+</div>
                  <div>Drag & drop images or PDFs</div>
                </div>
              </div>

              <div class="panel p-ocr">
                <div class="p-head">
                  <span class="p-title">OCR extraction</span>
                </div>
                <div class="code">
                  <div class="c-line w-80"></div>
                  <div class="c-line w-65"></div>
                  <div class="c-line w-90"></div>
                  <div class="c-line w-50"></div>
                </div>
              </div>

              <div class="panel p-quiz">
                <div class="p-head">
                  <span class="p-title">Generated quiz</span>
                </div>
                <div class="quiz-mini">
                  <div class="mini-q">[MCQ] Which layer handles routing?</div>
                  <div class="mini-opts">
                    <span class="mini-opt">Presentation</span>
                    <span class="mini-opt is-right">Network</span>
                    <span class="mini-opt">Session</span>
                    <span class="mini-opt">Transport</span>
                  </div>
                  <div class="mini-progress"><div class="mini-bar"></div></div>
                </div>
              </div>
            </div>
          </div>

          <div class="cta">
            <div class="cta-copy">
              <h3 class="h3">Ready to weave your study plan?</h3>
              <p class="muted">Start now.</p>
            </div>
            <form class="cta-form" @submit.prevent>
              <input type="email" placeholder="Email address" aria-label="Email" />
              <button class="btn btn-primary btn-lg">Get started</button>
            </form>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer" id="docs">
      <div class="container foot">
        <div class="foot-col">
          <div class="brand foot-brand">
            <span class="brand-mark" aria-hidden="true">
              <svg class="tl" width="22" height="22" viewBox="0 0 64 64" fill="none">
                <defs>
                  <linearGradient id="gTLFoot" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop :stop-color="brand1" offset="0"/>
                    <stop :stop-color="brand2" offset="1"/>
                  </linearGradient>
                </defs>
                <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#gTLFoot)" opacity=".18"/>
                <rect x="4.5" y="4.5" width="55" height="55" rx="15.5" stroke="url(#gTLFoot)" opacity=".35"/>
                <path d="M10 16H54V24H38V52H26V24H10V16Z" fill="url(#gTLFoot)"/>
                <path d="M38 52V24H46V44H54V52H38Z" fill="url(#gTLFoot)" opacity=".8"/>
              </svg>
            </span>
            <span class="brand-text">TestLoom</span>
          </div>
          <p class="muted">Practice. Discuss. Improve.</p>
        </div>
        <nav class="foot-col foot-links" aria-label="Footer">
          <a href="#">Status</a>
          <a href="#">Privacy</a>
        </nav>
      </div>
      <div class="container foot-copy">© {{ year }} TestLoom</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

useHead({
  title: 'TestLoom',
  meta: [
    { name: 'description', content: 'Professional, cohesive exam-prep platform: OCR uploads, adaptive quizzes, real-time discussions, analytics.' },
    { name: 'theme-color', content: '#080a0f' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' }
  ]
})

const year = new Date().getFullYear()

const brand1 = '#7c5cff'
const brand2 = '#22d3ee'

const pageEl = ref(null)
let rafId
let cx = 0, cy = 0
let tx = 0, ty = 0
let animate

onMounted(() => {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    pageEl.value?.style.setProperty('--glow-opacity', '0')
    return
  }

  const startX = window.innerWidth * 0.55
  const startY = window.innerHeight * 0.25
  cx = startX; cy = startY; tx = startX; ty = startY
  pageEl.value?.style.setProperty('--mx', `${cx}px`)
  pageEl.value?.style.setProperty('--my', `${cy}px`)
  pageEl.value?.style.setProperty('--glow-opacity', '0.22')

  const onMove = (e) => {
    tx = e.clientX
    ty = e.clientY
  }

  animate = () => {
    // Smooth follow
    cx += (tx - cx) * 0.12
    cy += (ty - cy) * 0.12
    if (pageEl.value) {
      pageEl.value.style.setProperty('--mx', `${cx}px`)
      pageEl.value.style.setProperty('--my', `${cy}px`)
    }
    rafId = requestAnimationFrame(animate)
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  rafId = requestAnimationFrame(animate)

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onMove)
    cancelAnimationFrame(rafId)
  })
})
</script>

<style>
/* Design System Variables & Base Styles */
:root {
  --bg-dark: #080a0f;
  --bg-light: #11141c;
  --surface: #0f131b;
  --surface-2: #141923;
  --edge: #1c2230;
  --edge-hover: #2d3548;
  --text: #e6e9f0;
  --muted: #9aa3b2;

  --brand-1: #7c5cff; /* violet */
  --brand-2: #22d3ee; /* cyan */

  --icon-c1: #a391ff;
  --icon-c2: #80e0ff;
  --icon-c3: #8cffcf;
  --icon-c4: #60a5fa;
  --icon-c5: #fde047;
  --icon-c6: #f472b6;

  --radius-s: 12px;
  --radius-m: 16px;
  --radius-l: 22px;
  --shadow-1: 0 10px 30px rgba(0, 0, 0, .35);

  --ease-1: cubic-bezier(0.23, 1, 0.32, 1);
  --transition-1: all 0.28s var(--ease-1);

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 40px; --space-8: 48px;
  --space-9: 64px; --space-10: 80px;

  --fs-1: clamp(0.92rem, 0.85rem + 0.2vw, 1.00rem);
  --fs-2: clamp(1.00rem, 0.95rem + 0.35vw, 1.125rem);
  --fs-3: clamp(1.125rem, 1.05rem + 0.5vw, 1.25rem);
  --fs-4: clamp(1.35rem, 1.15rem + 1.0vw, 1.6rem);
  --fs-5: clamp(1.8rem, 1.3rem + 2vw, 2.4rem);
  --fs-6: clamp(2.4rem, 1.8rem + 3vw, 3.2rem);
}

/* Global Animations */
@keyframes fadeIn-Up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
@keyframes pulse-glow { 0%,100% { box-shadow: 0 0 15px -6px currentColor; } 50% { box-shadow: 0 0 22px 0 currentColor; } }

/* Global Resets and Base Typography */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
html, body, #__nuxt { height: 100%; }

::selection { background: color-mix(in oklab, var(--brand-1) 35%, transparent); color: var(--text); }
body {
  margin: 0;
  color: var(--text);
  background: radial-gradient(circle at 50% 0%, var(--bg-light), var(--bg-dark) 50%);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: var(--fs-2);
  line-height: 1.55;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
/* Cursor-follow glow */
.page { position: relative; isolation: isolate; }
.page::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  /* Cyan glow follows cursor with smooth easing */
  background:
    radial-gradient(550px 350px at var(--mx, 50%) var(--my, 25%),
      color-mix(in oklab, var(--brand-2) 25%, transparent) 0%,
      color-mix(in oklab, var(--brand-2) 12%, transparent) 25%,
      transparent 60%);
  mix-blend-mode: screen;
  opacity: var(--glow-opacity, .22);
  transition: opacity .3s ease;
  z-index: -1;
}

/* Layout */
.container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section { padding: var(--space-10) 0; }
.section-alt { background: linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.01)); }

/* Typography */
.h1, .h2, .h3 { letter-spacing: -0.015em; }
.h1 { font-size: var(--fs-6); line-height: 1.07; margin: 0 0 var(--space-4); }
.h2 { font-size: var(--fs-5); line-height: 1.15; margin: 0; }
.h3 { font-size: var(--fs-4); margin: 0; }
.lead { color: var(--muted); font-size: var(--fs-3); margin: 0 0 var(--space-6); }
.kicker { color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: .16em; font-size: 11.5px; }
.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-5); margin-bottom: var(--space-7); }
.section-lead { color: var(--muted); margin-top: var(--space-3); }

/* Header */
.header {
  position: sticky; top: 0; z-index: 50;
  background: color-mix(in oklab, var(--bg-dark) 78%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--edge);
}
.nav { height: 72px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--space-6); }
.brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); font-weight: 800; letter-spacing: .2px; transition: var(--transition-1); }
.brand:hover { transform: translateY(-1px) scale(1.01); }
.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: #0c1018; border: 1px solid var(--edge); position: relative; overflow: hidden; }
.brand-mark .tl { display: block; }
.brand:hover .brand-mark { box-shadow: 0 0 24px color-mix(in oklab, var(--brand-2) 45%, transparent), inset 0 0 0 1px color-mix(in oklab, var(--brand-2) 30%, transparent); }

.links { display: flex; gap: 18px; justify-content: center; }
.links a {
  color: var(--muted); text-decoration: none; padding: 8px 12px; border-radius: 10px; transition: var(--transition-1);
  position: relative;
}
.links a::after {
  content: ""; position: absolute; left: 12px; right: 12px; bottom: 6px; height: 2px; border-radius: 2px;
  background: linear-gradient(90deg, var(--brand-1), var(--brand-2)); transform: scaleX(0); transform-origin: left; transition: transform .25s var(--ease-1);
}
.links a:hover { color: var(--text); background: var(--surface-2); transform: translateY(-1px); }
.links a:hover::after { transform: scaleX(1); }
.actions { display: flex; gap: 10px; }

/* Buttons */
.btn {
  --b: var(--edge);
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 40px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--b);
  background: var(--surface); color: var(--text); text-decoration: none; font-weight: 700;
  transition: var(--transition-1);
  position: relative; overflow: hidden;
}
.btn::before {
  content: ""; position: absolute; inset: 0; background: radial-gradient(120px 40px at var(--hx, 50%) 0%, rgba(255,255,255,.08), transparent 60%); opacity: 0; transition: opacity .25s ease;
}
.btn:hover::before { opacity: 1; }
.btn:hover { border-color: var(--edge-hover); background: var(--surface-2); transform: translateY(-2px); }
.btn:active { transform: translateY(-1px) scale(0.99); }
.btn-lg { height: 46px; padding: 0 20px; font-size: var(--fs-2); }
.btn-ghost { background: transparent; }
.btn-dark { background: var(--bg-dark); }
.btn-primary {
  border: none; color: #f0f3f8;
  background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
  box-shadow: 0 8px 25px rgba(34, 211, 238, .22);
}
.btn-primary:hover { filter: brightness(1.1) saturate(1.1); box-shadow: 0 10px 32px rgba(34, 211, 238, .3); }

.btn:hover { --hx: 50%; }
.btn { --hx: 50%; }

/* Pills */
.pill { display: inline-flex; align-items: center; height: 30px; padding: 0 14px; border-radius: 999px;
  background: var(--surface); border: 1px solid var(--edge); color: #cbd2df; font-size: 13px; font-weight: 500; }
.hero-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: var(--space-5); }

/* Hero */
.hero { position: relative; padding: var(--space-9) 0 var(--space-8); overflow: clip; }
.hero-copy > * { animation: fadeIn-Up 0.6s var(--ease-1) forwards; opacity: 0; }
.hero-copy h1 { animation-delay: 0.15s; } .hero-copy p { animation-delay: 0.25s; }
.hero-copy .cta-row { animation-delay: 0.35s; } .hero-copy .hero-meta { animation-delay: 0.45s; }

.grid {
  position: absolute; inset: 0; pointer-events: none; opacity: .65;
  background:
    radial-gradient(800px 500px at 10% -10%, color-mix(in oklab, var(--brand-1) 25%, transparent), transparent 60%),
    radial-gradient(1000px 600px at 90% 30%, color-mix(in oklab, var(--brand-2) 20%, transparent), transparent 65%),
    repeating-linear-gradient(0deg, transparent 0 39.5px, rgba(255,255,255,.04) 40px),
    repeating-linear-gradient(90deg, transparent 0 39.5px, rgba(255,255,255,.04) 40px);
}
.hero-grid { position: relative; display: grid; grid-template-columns: 6fr 5fr; align-items: center; gap: var(--space-8); }
@media (max-width: 980px) { .hero-grid { grid-template-columns: 1fr; } }

.hero-visual { position: relative; perspective: 1000px; animation: fadeIn-Up 0.6s var(--ease-1) 0.6s forwards; opacity: 0;}
.glass-card {
  background: linear-gradient(160deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
  border: 1px solid var(--edge); border-radius: var(--radius-l); overflow: hidden;
  box-shadow: var(--shadow-1); transition: var(--transition-1); will-change: transform, box-shadow;
}
.hero-visual:hover .glass-card { transform: scale(1.03) rotateY(-4deg) rotateX(2deg); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.glass-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(0,0,0,.15); border-bottom: 1px solid var(--edge); }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.dot-red { background: #ff6b6b; } .dot-yellow { background: #fbbf24; } .dot-green { background: #22c55e; }
.glass-title { color: #b9c2d4; font-weight: 700; font-size: 13px; margin-left: 4px; }
.glass-body { padding: 20px; }
.quiz-row { margin-bottom: 16px; }
.q { font-weight: 700; margin-bottom: 12px; }
.opts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.opt { height: 42px; border: 1px solid var(--edge); border-radius: 12px; background: var(--surface); color: var(--text); cursor: pointer; transition: var(--transition-1); }
.opt:hover { background: var(--surface-2); border-color: var(--edge-hover); }
.is-correct { border-color: color-mix(in oklab, var(--brand-2) 60%, var(--edge)); background: color-mix(in oklab, var(--brand-2) 10%, var(--surface)); color: #d0faff; }
.progress { height: 8px; background: var(--bg-dark); border-radius: 999px; border: 1px solid var(--edge); margin: 18px 0; overflow: hidden; }
.bar { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--brand-1), var(--brand-2)); }
.stats { display: flex; gap: 24px; color: var(--muted); }
.stat { font-weight: 800; margin-right: 6px; color: var(--text); }
.orb { position: absolute; filter: blur(30px); opacity: .5; border-radius: 50%; animation: float 10s ease-in-out infinite; }
.orb-1 { width: 220px; height: 220px; right: -40px; bottom: -60px; background: radial-gradient(circle at 30% 30%, var(--brand-1), transparent 60%); animation-delay: -5s; }
.orb-2 { width: 160px; height: 160px; left: -30px; top: -30px; background: radial-gradient(circle at 30% 30%, var(--brand-2), transparent 60%); }

/* Feature cards */
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); }
@media (max-width: 980px) { .cards { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .cards { grid-template-columns: 1fr; } }

.card {
  background: var(--surface);
  border: 1px solid var(--edge); border-radius: var(--radius-m);
  padding: var(--space-6); transition: var(--transition-1);
  position: relative; overflow: hidden; cursor: pointer;
  animation: fadeIn-Up 0.5s var(--ease-1) forwards; opacity: 0;
}
.card:nth-child(1) { animation-delay: 0.1s; } .card:nth-child(2) { animation-delay: 0.2s; }
.card:nth-child(3) { animation-delay: 0.3s; } .card:nth-child(4) { animation-delay: 0.15s; }
.card:nth-child(5) { animation-delay: 0.25s; } .card:nth-child(6) { animation-delay: 0.35s; }

.card:hover, .card:focus-visible {
  transform: translateY(-5px);
  background: var(--surface-2);
  border-color: var(--edge-hover);
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
}
.card h3 { margin: 12px 0 6px; font-size: var(--fs-3); }
.card p { margin: 0; color: var(--muted); }
.icon {
  width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center;
  background: var(--surface-2); border: 1px solid var(--edge); margin-bottom: var(--space-3);
  color: currentColor; transition: var(--transition-1);
}
.card:hover .icon { transform: scale(1.05); }
.icon-1 { color: var(--icon-c1); } .icon-2 { color: var(--icon-c2); } .icon-3 { color: var(--icon-c3); }
.icon-4 { color: var(--icon-c4); } .icon-5 { color: var(--icon-c5); } .icon-6 { color: var(--icon-c6); }
.card:hover .icon { animation: pulse-glow 2.5s var(--ease-1) infinite; }

/* Workflow */
.flow { display: grid; grid-template-columns: 5fr 6fr; gap: var(--space-8); align-items: start; }
@media (max-width: 980px) { .flow { grid-template-columns: 1fr; } }

/* Timeline */
.timeline { list-style: none; margin: 0; padding: 0; position: relative; }
.timeline::before { content: ""; position: absolute; left: 16px; top: 16px; bottom: 16px; width: 2px; background: var(--edge); }
.t-item { position: relative; padding-left: 60px; margin-bottom: var(--space-6); opacity: 0; animation: fadeIn-Up 0.5s var(--ease-1) forwards; }
.timeline .t-item:nth-child(1) { animation-delay: 0.1s; }
.timeline .t-item:nth-child(2) { animation-delay: 0.2s; }
.timeline .t-item:nth-child(3) { animation-delay: 0.3s; }
.timeline .t-item:nth-child(4) { animation-delay: 0.4s; }
.timeline .t-item:nth-child(5) { animation-delay: 0.5s; }

.node {
  position: absolute; left: 0; top: 0; width: 34px; height: 34px; border-radius: 50%;
  display: grid; place-items: center; font-weight: 900; color: #0b0e14;
  background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
  box-shadow: 0 8px 18px rgba(34,211,238,.25);
  transition: var(--transition-1);
}
.t-item:hover .node { transform: scale(1.1); box-shadow: 0 8px 25px rgba(34,211,238,.35); }
.t-content { background: var(--surface); border: 1px solid var(--edge); border-radius: var(--radius-m); padding: var(--space-5); transition: var(--transition-1); }
.t-item:hover .t-content { background: var(--surface-2); border-color: var(--edge-hover); }
.t-content h4 { margin: 0 0 6px; font-size: var(--fs-3); }
.t-content p { margin: 0; color: var(--muted); }

/* Preview stack */
.flow-previews { display: grid; gap: var(--space-6); position: sticky; top: 100px; }
.panel { background: var(--surface); border: 1px solid var(--edge); border-radius: var(--radius-l); overflow: hidden; box-shadow: var(--shadow-1); }
.p-head { display: flex; align-items: center; height: 44px; padding: 0 16px; border-bottom: 1px solid var(--edge); background: var(--bg-dark); }
.p-title { font-weight: 700; color: #cbd2df; font-size: 13.5px; }

.p-drop .dropzone {
  display: grid; place-items: center; gap: 10px; padding: 28px; color: #cbd2df; text-align: center;
  border: 2px dashed var(--edge); margin: 16px; border-radius: 16px; background: var(--bg-dark); transition: var(--transition-1);
}
.p-drop .dropzone:hover { border-color: color-mix(in oklab, var(--brand-2) 60%, var(--edge)); background: var(--surface); }
.dz-icon { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, var(--brand-1), var(--brand-2)); color: #0b0e14; font-weight: 900; font-size: 1.2rem; }

.p-ocr .code { padding: 20px 16px; }
.c-line { height: 10px; background: var(--surface-2); border: 1px solid var(--edge); border-radius: 999px; margin-bottom: 12px; }
.c-line.w-90 { width: 90%; } .c-line.w-80 { width: 80%; } .c-line.w-65 { width: 65%; } .c-line.w-50 { width: 50%; }

.p-quiz .quiz-mini { padding: 16px; }
.mini-q { font-weight: 700; margin-bottom: 12px; }
.mini-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mini-opt { font-size: var(--fs-1); border: 1px solid var(--edge); border-radius: 10px; padding: 8px 12px; background: var(--bg-dark); }
.mini-opt.is-right { border-color: color-mix(in oklab, var(--brand-2) 60%, var(--edge)); background: color-mix(in oklab, var(--brand-2) 10%, var(--bg-dark)); color: #cefaff; }
.mini-progress { height: 6px; background: var(--bg-dark); border-radius: 999px; border: 1px solid var(--edge); margin-top: 14px; overflow: hidden; }
.mini-bar { height: 100%; width: 55%; background: linear-gradient(90deg, var(--brand-1), var(--brand-2)); }

/* CTA */
.cta { display: grid; grid-template-columns: 1fr auto; gap: var(--space-6); align-items: center; border: 1px solid var(--edge); border-radius: var(--radius-l); background: var(--surface); padding: var(--space-7); box-shadow: var(--shadow-1); margin-top: var(--space-8); }
@media (max-width: 760px) { .cta { grid-template-columns: 1fr; } }
.cta-form { display: flex; gap: 10px; }
.cta-form input { width: min(360px, 64vw); height: 46px; border-radius: 999px; border: 1px solid var(--edge); background: var(--bg-dark); color: var(--text); padding: 0 18px; outline: none; transition: var(--transition-1); }
.cta-form input::placeholder { color: #7e8798; }
.cta-form input:focus-visible { border-color: var(--brand-1); box-shadow: 0 0 0 3px color-mix(in oklab, var(--brand-1) 30%, transparent); }

/* Footer */
.footer { border-top: 1px solid var(--edge); margin-top: var(--space-6); }
.foot { display: grid; grid-template-columns: 1fr auto; gap: var(--space-6); padding: var(--space-7) 0; }
.foot-links { display: flex; gap: 18px; align-items: center; }
.foot-links a { color: var(--muted); text-decoration: none; transition: var(--transition-1); }
.foot-links a:hover { color: var(--text); }
.foot-copy { color: var(--muted); font-size: var(--fs-1); padding: var(--space-5) 0 var(--space-7); border-top: 1px solid var(--edge); }

/* Focus states */
:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--brand-2) 80%, white);
  outline-offset: 3px;
  border-radius: 10px;
}
.card:focus-visible { outline: none; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-copy > *, .hero-visual, .card, .t-item { animation: none !important; opacity: 1 !important; }
  .orb { animation: none !important; }
}
</style>