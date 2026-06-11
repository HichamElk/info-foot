# Info-Foot

Application de suivi football en temps reel : scores live, classements, statistiques detaillees.

## Stack

- **Backend** : Node.js + Express + node-cache (proxy API, securisation de la cle)
- **Frontend** : React 18 + Vite + Tailwind CSS (dark theme)
- **API** : api-football v3 via RapidAPI

## Fonctionnalites

- Scores en direct avec auto-refresh toutes les 30 secondes
- Matches du jour groupes par championnat
- Classements avec zones (UCL, Europa, relegation) et indicateur de forme
- Modal equipe : bilan, buts par mi-temps, stats avancees
- Modal match : evenements, statistiques comparatives, compositions
- 11 championnats europeens disponibles

## Installation

### Prerequis
- Node.js 18+
- Cle API sur RapidAPI (api-football-v1)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Editer .env : remplacer your_rapidapi_key_here par votre cle
npm run dev
```

Le backend tourne sur http://localhost:3001

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application est disponible sur http://localhost:5173

## Structure

```
info-foot/
├── backend/
│   ├── server.js              # Serveur Express (proxy + cache)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/football.js        # Client API
    │   ├── components/
    │   │   ├── live/
    │   │   │   ├── LiveScores.jsx
    │   │   │   └── MatchCard.jsx
    │   │   ├── match/
    │   │   │   └── MatchModal.jsx
    │   │   ├── standings/
    │   │   │   └── StandingsTable.jsx
    │   │   ├── Layout.jsx
    │   │   └── Sidebar.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   └── LeaguePage.jsx
    │   └── App.jsx
    └── package.json
```
