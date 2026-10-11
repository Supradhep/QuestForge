# QuestForge: AI Treasure Hunt Generator & Interactive Exploration Platform

QuestForge is a full-stack, algorithmic interactive tabletop web platform that procedurally synthesizes dynamic, puzzle-dense labyrinths and orchestrates intelligent gameplay. Combining rigorous graph algorithms with generative AI narrative synthesis, QuestForge delivers immersive, mechanically solvable quests with zero deadlocks and real-time adversary pursuit.

---

## Key Highlights & Features

- **Procedural Graph Labyrinth Synthesis:** Generates 100% connected labyrinths using Kruskal's Minimum Spanning Tree over Disjoint Set Union (DSU) with union-by-rank and path compression.
- **Topological Depth Layering:** Mathematically prevents trivial shortcuts between the entrance and the vault by enforcing stratum-constrained corridor generation.
- **Multi-Criteria Optimal Pathfinding:** Solves Dijkstra's shortest path over a multi-dimensional traversal cost function ($\text{Distance} + \text{Danger} + \text{Stamina Energy}$) to serve as an objective ground-truth benchmark.
- **Solvable Clue Dependency DAG:** Employs recursive backtracking with cycle detection to generate clue unlock dependencies, mathematically guaranteeing that keys and clues strictly precede the locked doors they resolve.
- **Dynamic Adversary Stalker ("The Hunter"):** Breadth-First Search (BFS) real-time pursuit AI that routes an autonomous hunter one step per turn toward the player while dynamically adapting to collapsed corridors.
- **Anti-Spoiler Generative Lore Gateway:** Leverages Google Gemini for atmospheric storytelling, poetic clue riddles, and semantic NLP guardian negotiations, backed by a deterministic regex sanitization pipeline that strips room-name leaks.
- **Post-Expedition Algorithmic Telemetry:** Interactive SVG comparison graphs contrasting the player's path against the theoretical Dijkstra benchmark, with granular energy, step, and backtracking analytics.

---

## Core Algorithms Implemented

| Algorithm | Implementation File | Functional Responsibility in QuestForge |
| :--- | :--- | :--- |
| **Kruskal's MST** | `backend/app/algorithms/mst.py` | Constructs a minimal connected spanning backbone ensuring 100% reachability across chambers. |
| **Topological Depth Layering** | `backend/app/algorithms/mst.py` | Enforces minimum hop counts between Start and Treasure Vault ($|layer(u) - layer(v)| \le 1$). |
| **Dijkstra's Algorithm** | `backend/app/algorithms/dijkstra.py` | Computes theoretical minimum-cost route over composite metrics ($\text{Distance} + \text{Danger} + \text{Energy}$). |
| **Backtracking DAG Solver** | `backend/app/algorithms/backtracking.py` | Generates an acyclic clue unlock dependency graph, completely eliminating circular deadlocks. |
| **Breadth-First Search (BFS)** | `backend/app/algorithms/bfs.py` | Validates unweighted reachability and routes the autonomous "Hunter" stalker during active gameplay. |

---

## Interactive Application Modules

- **Expedition Configuration Dashboard:** Modulate chamber density, clue frequency, trap penalties, time limits, and active twists across diverse thematic realms.
- **Active Tabletop Navigation & Exploration HUD:** Real-time stamina and life telemetry, sensory chamber descriptions, and multi-criteria corridor choices.
- **Cryptic Field Notes & Anti-Spoiler Riddles:** Slide-over Field Notes notebook displaying poetic clue enigmas sanitized to eliminate room-name leaks.
- **Interactive NLP Vault Guardian Negotiation:** Submit natural language riddle answers evaluated semantically by Google Gemini to unseal the final vault.
- **Post-Expedition Dual-Route Comparison Graph:** Interactive vector graph comparing the player's actual exploration route against Dijkstra's optimal path.
- **Algorithm Telemetry & Complexity Analytics:** Real-time graph metrics, spanning tree edge counts, and algorithm execution statistics.

---

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript (Vite bundler)
- **Styling:** Tailwind CSS with custom tabletop fantasy UI themes
- **Graphics & Animation:** Interactive SVG Vector Graph Canvas, Framer Motion
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **ORM & Database:** SQLAlchemy 2.0 with SQLite
- **Algorithms:** Pure Python standard library (`heapq`, `collections`, `random`) with zero external framework dependencies
- **AI Gateway:** Google Gemini API (`google-genai` / REST) with local deterministic fallback engine

---

## Project Structure

```
Daa project/
│
├── backend/
│   ├── app/
│   │   ├── ai/                # Gemini narrative gateway & evaluation
│   │   ├── algorithms/        # Pure DAA algorithms (MST, Dijkstra, Backtracking, BFS)
│   │   ├── api/               # FastAPI REST endpoints
│   │   ├── database/          # Database session configuration
│   │   ├── game/              # Labyrinth generator & regex sanitization pipeline
│   │   ├── models/            # SQLAlchemy database models
│   │   └── schemas/           # Pydantic validation schemas
│   ├── requirements.txt       # Python package dependencies
│   └── .env.example           # Environment template (Gemini API key)
│
├── frontend/
│   ├── src/
│   │   ├── components/        # GraphCanvas, UI primitives, AppShell
│   │   ├── pages/             # LandingPage, CreateHunt, PlayHunt, Results, Analysis
│   │   ├── services/          # Axios/fetch API client
│   │   └── types/             # TypeScript data contracts
│   ├── package.json           # Frontend package manifests
│   └── vite.config.ts         # Vite build configuration
├── .gitignore                 # Excludes venv, node_modules, .env, and local DB
└── README.md                  # Project documentation
```

---

## Getting Started Locally

### Prerequisites
- **Node.js:** v18.0 or higher
- **Python:** v3.10 or higher
- **Google Gemini API Key:** (Optional, a built-in deterministic offline fallback is provided)

---

### Step 1: Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   # Copy the template:
   cp .env.example .env
   ```
   Edit `.env` and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```

5. Launch the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API documentation will be accessible at: `http://localhost:8000/docs`

---

### Step 2: Frontend Setup

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   The application will be live at: `http://localhost:5173`

---


## License
Academic coursework project under MIT License.
