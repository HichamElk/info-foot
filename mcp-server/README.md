# info-foot MCP

Serveur MCP (stdio) qui expose les données football d'info-foot à Claude.

Il ne parle pas directement à api-sports : il appelle les routes `/api/*` du
backend Express (`info-foot/backend`), qui gèrent la clé API, le cache et les
quotas. Tous les outils sont en **lecture seule**.

## Prérequis

- Node.js ≥ 23 (exécute le `.ts` nativement, sans build) — testé sur v24
- Le backend info-foot accessible (local sur `:3001`, ou la prod Render)

## Outils exposés

| Outil | Description |
|---|---|
| `get_live_matches` | Matchs en direct, toutes compétitions |
| `get_today_matches` | Matchs programmés aujourd'hui |
| `get_world_cup_matches` | Coupe du Monde 2026 (fenêtre glissante 14 j) |
| `get_standings` | Classement d'une ligue (`leagueId`, `season?`) |
| `get_upcoming_fixtures` | 10 prochains matchs d'une ligue |
| `get_team_stats` | Stats d'une équipe (`teamId`, `leagueId`, `season?`) |
| `get_match_details` | Événements + stats + compos d'un match (`fixtureId`) |

## Configuration

Le serveur est déclaré dans le `.mcp.json` à la racine du projet. La variable
`INFO_FOOT_API_URL` choisit le backend :

- `http://localhost:3001/api` — backend local (défaut, nécessite `npm run dev` dans `backend/`)
- `https://info-foot.onrender.com/api` — backend de prod

Après modification du `.mcp.json`, relancer Claude Code et approuver le serveur
(`/mcp` pour voir l'état).

## Test rapide (sans Claude)

```bash
cd info-foot/mcp-server
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | node index.ts
```

## Plus tard : distribution

Pour le partager à d'autres (sans qu'ils aient Node), packager en **MCPB**
(runtime bundlé) — voir la skill `build-mcpb`. Pour un usage perso/équipe, le
stdio local actuel suffit.
