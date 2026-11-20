---
version: 2.0.0
name: Probaho-SCM-Design-System
source: "Figma Community Template: SCM(Supply Chain Management) [1354682817335330954] & awesome-design-md"
description: "A high-precision, enterprise-grade decision-support canvas engineered for medicine supply chain resilience in Bangladesh. Modeled after the Figma SCM (Supply Chain Management) UI system: signature deep forest teal sidebar (#072c33), crisp enterprise canvas (#f4f6f9), pure white card surfaces (#ffffff), subtle hairline dividers (#e2e8f0), and vibrant turquoise-teal (#00a896) as the core operational accent. Mathematical rigor, tabular numerals, bilingual Bangla/English typography, WCAG AA compliance, and zero-flicker micro-interactions."

colors:
  # Canvas & Surfaces
  canvas: "#f4f6f9"
  canvas-subtle: "#eef2f6"
  sidebar: "#072c33"
  sidebar-border: "#0b3d47"
  sidebar-active: "#00a896"
  surface-card: "#ffffff"
  surface-card-subtle: "#f8fafc"
  surface-hover: "rgba(0, 168, 150, 0.04)"
  
  # Brand & Focus Accent (Figma SCM Teal)
  primary: "#00a896"
  primary-hover: "#008c7d"
  primary-active: "#007366"
  primary-muted: "rgba(0, 168, 150, 0.10)"
  primary-glow: "rgba(0, 168, 150, 0.25)"
  on-primary: "#ffffff"

  # Hairlines & Dividers
  hairline: "#e2e8f0"
  hairline-strong: "#cbd5e1"
  hairline-accent: "rgba(0, 168, 150, 0.3)"

  # Text & Typography (Ink)
  ink-primary: "#0f172a"
  ink-secondary: "#334155"
  ink-muted: "#64748b"
  ink-subtle: "#94a3b8"

  # Semantics & Status Badges
  semantic-critical: "#f43f5e"
  semantic-critical-muted: "#fff1f2"
  semantic-critical-border: "#fecdd3"
  
  semantic-warning: "#f59e0b"
  semantic-warning-muted: "#fffbeb"
  semantic-warning-border: "#fde68a"

  semantic-success: "#10b981"
  semantic-success-muted: "#ecfdf5"
  semantic-success-border: "#a7f3d0"

  semantic-info: "#0284c7"
  semantic-info-muted: "#f0f9ff"
  semantic-info-border: "#bae6fd"

typography:
  font-primary: "Inter, 'Noto Sans Bengali', system-ui, -apple-system, sans-serif"
  font-mono: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace"
  scale:
    display: "text-3xl font-extrabold tracking-tight"
    heading-1: "text-2xl font-bold tracking-tight"
    heading-2: "text-lg font-semibold tracking-tight"
    body-regular: "text-sm font-normal text-slate-700"
    label-kpi: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
    value-kpi: "text-2xl font-bold text-slate-900 tabular-nums"

components:
  kpi-cards:
    background: "bg-white"
    border: "border border-slate-200/90"
    border-radius: "rounded-xl"
    padding: "p-5"
    shadow: "shadow-xs hover:shadow-md transition-shadow"
    icon-badge: "w-12 h-12 rounded-full flex items-center justify-center pastel-tinted"
  tables:
    header: "bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200"
    row: "hover:bg-slate-50/60 border-b border-slate-100 text-sm text-slate-700"
  batch-grid:
    card: "bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-[#00a896] hover:shadow-md"
    pagination: "pills with active teal background #00a896 text-white"
---

# PROBAHO UI Design System (Figma SCM Edition)

Adopted from the Figma Community UI Template: **SCM(Supply Chain Management)** ([File ID 1354682817335330954](https://www.figma.com/community/file/1354682817335330954/scmsupply-chain-management)).

## Key Design Principles
1. **Clear Multi-Echelon Visual Hierarchy:** Deep forest teal sidebar (`#072c33`) anchors navigation, pure white card modules elevate data points, and soft canvas (`#f4f6f9`) reduces cognitive fatigue.
2. **Circular Pastel KPI Badges:** Left-aligned circular pastel containers (`w-12 h-12 rounded-full`) give instant visual categorization to critical supply chain indicators.
3. **Consignment Card Grid:** Documents and batch tracking formatted as uniform cards with document glyphs, active status pills, and quick detail triggers.
4. **Bilingual Typography Balance:** Seamless pairing of Inter for numerical/English data and Noto Sans Bengali for local terminology.
