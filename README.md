# StoryDAW Mini

**Visual Story Structure & Text-Only Manga Storyboard Designer powered by Meta Muse (`muse-spark`)**

StoryDAW Mini is a single-screen, DAW-inspired (Digital Audio Workstation) blueprint application designed for manga and comic creators. Instead of generating black-box AI images that override an artist's visual style, StoryDAW Mini treats **dramatic tension as an automation curve**—allowing creators to visually lock their world setting and character constants (**World Lock**), sculpt a 4-track **Ki-Sho-Ten-Ketsu** narrative timeline with real-time **Tension (0–100)** sliders, and generate structured, text-only manga storyboard briefs (**"Name" / ネーム指示書**) with panel sizes, camera angles, blocking directions, and dialogue.

---

## 🎯 Alignment with "Build for Your World"

Manga and webtoon creators face a critical bottleneck not in drawing itself, but in **structural storyboarding ("Name" / ネーム)**: translating plot beats into page-by-page panel layouts, camera angles, and pacing.

- **Respecting Creative Ownership (Zero Image Generation)**: Artists want full control over their line art and character designs. StoryDAW Mini intentionally generates **zero images**, focusing 100% on text-only architectural blueprints that serve the human creator.
- **World Lock (Immutable Constants)**: Creators lock their work's title, world setting, core theme, and character voices in the Left Panel. The AI is strictly constrained from altering these canon rules.
- **DAW-Style Tension Automation**: Just as a music producer automates volume or filter cutoff across a timeline, a manga creator adjusts a numerical **Tension Slider (0–100)** across the four classical Japanese narrative phases (**Ki** = Intro, **Sho** = Development, **Ten** = Climax, **Ketsu** = Resolution).
- **Bilingual Creative Workflow (`EN` / `日本語`)**: Instant one-click toggle between English and Japanese UI, presets (*"Neon Ramen 2099"* / *「ネオン・ラーメン 2099」*), and generated storyboard briefs.

---

## ⚡ How Meta Muse API Drives Tension-Aware Storyboarding

When the creator clicks **Generate Storyboard Brief (Meta Muse API)**, the Cloudflare Pages Function (`POST /api/generate`) sends the locked `WorldLock` constants and the ordered `StoryBlock[]` tracks to the **Meta Model API (`muse-spark`)** via its OpenAI-compatible `/chat/completions` endpoint.

The system prompt enforces strict directorial rules that translate numerical **Tension (`0–100`)** into concrete manga cinematography:

| Tension Tier | Panel Density | Panel Sizes | Camera & Blocking Direction | Dialogue & SFX Pacing |
| :--- | :--- | :--- | :--- | :--- |
| **Low (`0–35`)** | **4–5 panels / page** | Mostly `medium` & `small` | Long shots, Eye-level, atmospheric establishing views, subtle detail close-ups | Unhurried, reflective dialogue and quiet ambient SFX |
| **Mid (`36–70`)** | **4–5 panels / page** | `medium` & `small` | Bust-up shots, Over-the-shoulder, Shot-reverse-shot framing | Brisk back-and-forth dialogue and escalating tension |
| **High (`71–100`)** | **2–3 panels / page** | Dominated by `large` & `wide` impact panels | Extreme close-ups, Low angle (*Aori* / worm's-eye), High angle (*Fukan* / bird's-eye), Dutch tilt | Ultra-concise, high-impact lines and explosive SFX |

### Built-In Before / After Structural Diff View
When a creator adjusts a block's Tension (for example, raising `Ki` from `20` to `85` or lowering `Ten` from `90` to `25`) and regenerates, toggling **Show Diff (Before / After)** highlights the exact structural transformation side-by-side:
- Panel count delta (e.g., `4 Panels → 2 Panels`)
- Panel size badge shifts (`MEDIUM → WIDE`)
- Camera angle & composition changes
- Dialogue compression

---

## 🏗️ Architecture (Cloudflare Pages + Pages Functions)

```text
├── functions/
│   └── api/
│       └── generate.ts      # Cloudflare Pages Function (POST /api/generate)
│                            # Calls Meta Model API (muse-spark) with JSON schema enforcement
│                            # + Dynamic Tension Engine fallback for zero-key instant testing
├── src/
│   ├── types.ts             # Core TypeScript interfaces (WorldLock, StoryBlock, StoryboardResult)
│   ├── presetData.ts        # 0-second playable preset ("Neon Ramen 2099" in EN & JA)
│   ├── App.tsx              # Single-screen 3-column DAW interface with SVG Tension Graph & Diff View
│   └── main.tsx             # React 18 entry point
├── index.html               # Blueprint light-mode palette (#FAFAFA / #FFFFFF / #18181B / #2563EB)
├── vite.config.ts           # Vite config + local Cloudflare Pages Functions middleware
└── .dev.vars.example        # Environment variable template for Meta Model API
```

### Key Technical Highlights
1. **Zero-Dependency Real-Time SVG Graph**: The Tension Curve in the center column uses native `<svg>`, `<polyline>`, and `<circle>` elements bound directly to React state for instant 60fps feedback without heavy chart libraries.
2. **100% Viewport-Locked DAW Layout**: The entire workspace fits into a single screen (`h-screen overflow-hidden`) with independent scrollable columns, sticky SVG automation curve, and page-switching tabs (`Page 1 (KI)` – `Page 4 (KETSU)` / `All Pages`).
3. **Inline Blueprint Editing & Persistence**: Every generated page summary, panel size badge, camera angle, composition direction, and dialogue line can be edited inline, auto-saved to `localStorage`, or exported as a `.json` file.
4. **Resilient Fallback Engine**: If `META_API_KEY` is not configured in local testing, `functions/api/generate.ts` automatically falls back to a deterministic **Dynamic Tension Engine** that synthesizes valid `StoryboardResult` JSON reflecting the exact `worldLock`, `tension` tier, `pages` count, `event`, and language (`en` / `ja`).

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Meta Model API Key (Optional for Local Demo)
Copy `.dev.vars.example` to `.dev.vars` and set your Meta API credentials:
```ini
META_API_KEY=your_api_key_here
META_BASE_URL=https://api.llama.com/v1
META_MODEL=muse-spark
```
*(Note: Even without `.dev.vars`, the app works out-of-the-box using the built-in Dynamic Tension Fallback Engine so judges can test the full Tension Slider → Regenerate → Before/After Diff workflow immediately.)*

### 3. Start the Development Server
```bash
npm run dev
```
Open **http://localhost:5173/** in your browser.

### 4. Build for Production / Cloudflare Pages
```bash
npm run build
npx wrangler pages dev dist
```
