# 🛡️ AegisOrbit: Autonomous Space Situational Awareness & Constellation Telemetry Intelligence System

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SIH Problem Statement](https://img.shields.io/badge/Smart%20India%20Hackathon-PS%2026209-orange)](https://www.sih.gov.in/)

> **Smart India Hackathon (Problem Statement 26209: Space Technology)**
> An enterprise-grade, offline-first mission control platform providing real-time 3D orbital conjunction prediction, multivariate telemetry anomaly detection, and automated fuel-optimal Collision Avoidance Maneuver (CAM) planning.

---

## 🌟 Key Capabilities

1. **Interactive 3D Orbital Situational Awareness (Three.js / React Three Fiber):**
   - High-performance procedural Earth model with day/night illumination, coordinate grid, and atmospheric Fresnel glow.
   - Keplerian orbital propagator with J2 secular perturbation drift modeling.
   - Custom high-fidelity 3D satellite models with Gold Multi-Layer Insulation (MLI), articulated solar arrays, communication dish, and nadir optical sensors.
   - 65+ trackable space debris swarm objects including the *Cosmos-2251* collision target.
   - Dynamic 3D Covariance Uncertainty Ellipsoids and relative encounter miss-vectors.

2. **Multivariate Telemetry Intelligence & Explainable AI (XAI):**
   - 6-channel live telemetry stream (ADCS Wheel 1–2 Speeds, Bus Voltage, Solar Array Current, Battery SoC, Subsystem Thermal Sensors).
   - Unsupervised multivariate anomaly detection engine flagging multi-sensor cross-divergences before bus tripping.
   - Natural language root cause diagnosis (*"Anomaly driven by 4.2σ divergence in Wheel 2 Speed vs Bus Voltage"*).

3. **Conjunction Screening & Automated CAM Planner:**
   - Real-time sortable conjunction triage queue with live Time-to-Closest-Approach (TCA) countdowns and collision probability ($P_c$).
   - Impulsive along-track and radial burn decision trade-off cards with Tsiolkovsky rocket equation fuel modeling (hydrazine $I_{\text{sp}} = 220\text{s}$).
   - 1-click maneuver execution with dynamic orbit replanning and post-burn $P_c$ re-evaluation.

4. **CCSDS Conjunction Data Message (CDM) Exporter:**
   - Standardized international space agency CDM inspection and 1-click JSON download.

5. **One-Click Demo Suite:**
   - Sticky top controller featuring pre-configured live scenarios for 3-minute hackathon judge evaluation.

---

## 📐 Mission Control Layout Map

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ AegisOrbit | MET: 00:04:12  │  [🔴 Conjunction] [⚡ Fault] [🚀 CAM] [🔄 Reset]  │  NOMINAL [CDM Report]  │ (48px)
├───────────────────────────────┬───────────────────────────────────────────┬────────────────────────────┤
│                               │                                           │ ⚠️ Conjunction Queue       │
│  📡 Subsystem Telemetry       │                                           │ • Pair: Aegis-1 v Cosmos   │
│  • Wheel 1 Speed (RPM)        │       🌍 3D Interactive Orbital           │ • TCA: T-44:18             │
│  • Wheel 2 Speed (RPM)        │           Situational Awareness           │ • Miss Dist: 147m          │
│  • Bus Voltage (28.0V)        │                                           │ • Pc: 4.2×10⁻³ [CRITICAL]  │
│  • Solar Current (5.1A)       │   • 3D Earth & Atmosphere Glow            ├────────────────────────────┤
│  • Battery SoC (88%)          │   • Constellation (Aegis 1–5)             │ 🚀 CAM Trade-Off Planner   │
│  • Panel Temp (24.5°C)        │   • 65 Tumbling Debris Items              │ • Opt 1 (Along-track):     │
│                               │   • 3D Covariance Ellipsoid               │   Δv +0.38 m/s, 95g fuel   │
│  ───────────────────────────  │   • [Target Telemetry HUD] (Top-Left)     │   Post Pc: 2.1×10⁻⁸        │
│  🔬 XAI Anomaly Root Cause    │   • [Camera Preset HUD] (Bottom-Left)     │ • Opt 2 (Radial):          │
│  "4.2σ in Wheel 2 vs Voltage" │                                           │   Δv +0.52 m/s, 131g fuel  │
│                               │                                           │   [Execute Burn Button]    │
│  (30% Width)                  │   (42% Width - Center Stage)              │ (28% Width)                │
└───────────────────────────────┴───────────────────────────────────────────┴────────────────────────────┘
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- `npm` or `yarn`

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/<your-username>/aegis-orbit.git
cd aegis-orbit

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:3000` in your browser. The application is completely self-contained and runs 100% offline.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🔬 Scientific & Engineering Formulations

- **Keplerian 2-Body Propagator:**
  $$\mu = 398600.4418 \text{ km}^3/\text{s}^2, \quad n = \sqrt{\frac{\mu}{a^3}}$$
  $$M(t) = M_0 + n \cdot \Delta t, \quad M = E - e \sin E$$

- **J2 Perturbation Secular Drift:**
  $$\dot{\Omega} = -\frac{3}{2} J_2 \left(\frac{R_E}{p}\right)^2 n \cos i, \quad \dot{\omega} = \frac{3}{2} J_2 \left(\frac{R_E}{p}\right)^2 n \left(2 - \frac{5}{2} \sin^2 i\right)$$

- **Collision Probability (Chan's Formulation):**
  $$u = \frac{r_{\text{obj}}^2}{\sigma_{\text{comb}}^2}, \quad v = \frac{d_{\text{miss}}^2}{\sigma_{\text{comb}}^2}, \quad P_c = e^{-v/2} \left(1 - e^{-u/2}\right)$$

- **Tsiolkovsky Rocket Fuel Equation:**
  $$\Delta m = m_{\text{dry}} \cdot \left(1 - e^{-\frac{\Delta v}{I_{\text{sp}} \cdot g_0}}\right)$$

---

## 📄 License
MIT License. Built for the Smart India Hackathon 2024.
