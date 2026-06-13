#!/usr/bin/env node
/**
 * Serveur MCP info-foot.
 *
 * Expose les donnees football a Claude en s'appuyant sur le backend Express
 * existant (info-foot/backend). Le MCP ne parle JAMAIS directement a api-sports :
 * il appelle les routes /api/* du backend, qui gerent la cle API, le cache et
 * les quotas. On reste ainsi en lecture seule et sans secret dans ce process.
 *
 * Transport : stdio (lance par Claude Code / Claude Desktop).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// URL du backend. Par defaut la prod Render (marche sans backend local lance).
// Pour pointer sur le backend local : INFO_FOOT_API_URL=http://localhost:3001/api
const BASE = (process.env.INFO_FOOT_API_URL || "https://info-foot.onrender.com/api").replace(/\/$/, "");

// Limite de securite : on tronque les sorties tres longues (Claude Code ~25k tokens).
const MAX_CHARS = 18000;

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

function text(s: string, isError = false): ToolResult {
  const clipped = s.length > MAX_CHARS ? s.slice(0, MAX_CHARS) + "\n…(tronque)" : s;
  return { content: [{ type: "text", text: clipped }], isError };
}

// api-sports renvoie TOUJOURS HTTP 200 ; les vrais problemes (compte suspendu,
// quota depasse, restriction de plan) sont dans le champ `errors`. On les
// remonte explicitement au lieu de renvoyer une liste vide silencieuse.
function apiErrors(json: any): string | null {
  const e = json?.errors;
  if (!e) return null;
  if (Array.isArray(e)) return e.length ? e.join(" ; ") : null;
  if (typeof e === "object") {
    const vals = Object.values(e).filter(Boolean);
    return vals.length ? vals.join(" ; ") : null;
  }
  return null;
}

async function getJson(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = (body as any).error || detail;
    } catch {
      /* corps non-JSON */
    }
    throw new Error(`Backend HTTP ${res.status} : ${detail}`);
  }
  return res.json();
}

// ---- Formatteurs (condensent le JSON brut en texte lisible) ----------------

function fmtFixture(f: any): string {
  const st = f.fixture?.status || {};
  const home = f.teams?.home?.name ?? "?";
  const away = f.teams?.away?.name ?? "?";
  const gh = f.goals?.home;
  const ga = f.goals?.away;
  const score = gh == null && ga == null ? "vs" : `${gh ?? 0}-${ga ?? 0}`;
  const date = f.fixture?.date ? new Date(f.fixture.date).toLocaleString("fr-FR") : "";
  const phase =
    st.short === "NS" ? date : `${st.long}${st.elapsed ? ` ${st.elapsed}'` : ""}`;
  const round = f.league?.round ? ` [${f.league.round}]` : "";
  return `${home} ${score} ${away} — ${phase}${round} (id:${f.fixture?.id})`;
}

function fmtFixtureList(fixtures: any[], title: string): string {
  if (!fixtures.length) return `${title} : aucun match.`;
  const byLeague = new Map<string, any[]>();
  for (const f of fixtures) {
    const key = `${f.league?.name ?? "?"} (${f.league?.country ?? ""})`;
    if (!byLeague.has(key)) byLeague.set(key, []);
    byLeague.get(key)!.push(f);
  }
  const blocks: string[] = [`${title} — ${fixtures.length} match(s) :`];
  for (const [league, list] of byLeague) {
    blocks.push(`\n## ${league}`);
    for (const f of list) blocks.push(`- ${fmtFixture(f)}`);
  }
  return blocks.join("\n");
}

function fmtStandings(json: any): string {
  const league = json.response?.[0]?.league;
  if (!league) return "Aucun classement disponible.";
  const tables: string[] = [`Classement — ${league.name} (${league.country}) ${league.season ?? ""}`];
  for (const group of league.standings ?? []) {
    for (const row of group) {
      const s = row.all || {};
      tables.push(
        `${String(row.rank).padStart(2)}. ${row.team?.name ?? "?"} — ${row.points} pts ` +
          `(J${s.played} ${s.win}V ${s.draw}N ${s.lose}D, diff ${row.goalsDiff})`,
      );
    }
    tables.push("");
  }
  return tables.join("\n");
}

// ---- Serveur ---------------------------------------------------------------

const server = new McpServer({ name: "info-foot", version: "1.0.0" });

const RO = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };

server.registerTool(
  "get_live_matches",
  {
    title: "Matchs en direct",
    description:
      "Liste tous les matchs de football actuellement en direct (toutes competitions), avec score et minute de jeu.",
    inputSchema: {},
    annotations: RO,
  },
  async () => {
    const json = await getJson("/live");
    const err = apiErrors(json);
    if (err) return text(`Erreur API foot : ${err}`, true);
    return text(fmtFixtureList(json.response || [], "Matchs en direct"));
  },
);

server.registerTool(
  "get_today_matches",
  {
    title: "Matchs du jour",
    description: "Liste tous les matchs programmes aujourd'hui, groupes par competition.",
    inputSchema: {},
    annotations: RO,
  },
  async () => {
    const json = await getJson("/today");
    const err = apiErrors(json);
    if (err) return text(`Erreur API foot : ${err}`, true);
    return text(fmtFixtureList(json.response || [], "Matchs du jour"));
  },
);

server.registerTool(
  "get_world_cup_matches",
  {
    title: "Matchs Coupe du Monde 2026",
    description:
      "Matchs de la Coupe du Monde 2026 sur une fenetre glissante (7 jours passes + 7 jours a venir), tries par date.",
    inputSchema: {},
    annotations: RO,
  },
  async () => {
    const json = await getJson("/wc");
    return text(fmtFixtureList(json.response || [], "Coupe du Monde 2026"));
  },
);

server.registerTool(
  "get_standings",
  {
    title: "Classement d'une ligue",
    description:
      "Classement complet d'une ligue pour une saison donnee. leagueId = identifiant api-sports (ex : 61 = Ligue 1, 39 = Premier League, 140 = Liga).",
    inputSchema: {
      leagueId: z.number().int().describe("ID api-sports de la ligue (ex : 61 pour la Ligue 1)"),
      season: z.number().int().optional().describe("Annee de la saison (defaut 2024)"),
    },
    annotations: RO,
  },
  async ({ leagueId, season }) => {
    const q = season ? `?season=${season}` : "";
    const json = await getJson(`/standings/${leagueId}${q}`);
    const err = apiErrors(json);
    if (err) return text(`Erreur API foot : ${err}`, true);
    return text(fmtStandings(json));
  },
);

server.registerTool(
  "get_upcoming_fixtures",
  {
    title: "Prochains matchs d'une ligue",
    description: "Les 10 prochains matchs programmes d'une ligue donnee.",
    inputSchema: {
      leagueId: z.number().int().describe("ID api-sports de la ligue"),
      season: z.number().int().optional().describe("Annee de la saison (defaut 2024)"),
    },
    annotations: RO,
  },
  async ({ leagueId, season }) => {
    const q = season ? `?season=${season}` : "";
    const json = await getJson(`/fixtures/${leagueId}${q}`);
    const err = apiErrors(json);
    if (err) return text(`Erreur API foot : ${err}`, true);
    return text(fmtFixtureList(json.response || [], "Prochains matchs"));
  },
);

server.registerTool(
  "get_team_stats",
  {
    title: "Statistiques d'une equipe",
    description:
      "Statistiques d'une equipe pour une ligue et une saison (forme, buts, moyennes…). Necessite teamId et leagueId api-sports.",
    inputSchema: {
      teamId: z.number().int().describe("ID api-sports de l'equipe"),
      leagueId: z.number().int().describe("ID api-sports de la ligue"),
      season: z.number().int().optional().describe("Annee de la saison (defaut 2024)"),
    },
    annotations: RO,
  },
  async ({ teamId, leagueId, season }) => {
    const q = `?league=${leagueId}${season ? `&season=${season}` : ""}`;
    const json = await getJson(`/teams/${teamId}/stats${q}`);
    const err = apiErrors(json);
    if (err) return text(`Erreur API foot : ${err}`, true);
    const r = json.response;
    if (!r) return text("Aucune statistique disponible.");
    const form = r.form || "";
    const g = r.goals || {};
    const lines = [
      `Stats — ${r.team?.name ?? "?"} / ${r.league?.name ?? "?"} ${r.league?.season ?? ""}`,
      `Forme recente : ${form}`,
      `Matchs joues : ${r.fixtures?.played?.total ?? "?"} ` +
        `(${r.fixtures?.wins?.total ?? 0}V ${r.fixtures?.draws?.total ?? 0}N ${r.fixtures?.loses?.total ?? 0}D)`,
      `Buts marques : ${g.for?.total?.total ?? "?"} (moy ${g.for?.average?.total ?? "?"}/match)`,
      `Buts encaisses : ${g.against?.total?.total ?? "?"} (moy ${g.against?.average?.total ?? "?"}/match)`,
      `Clean sheets : ${r.clean_sheet?.total ?? "?"}`,
    ];
    return text(lines.join("\n"));
  },
);

server.registerTool(
  "get_match_details",
  {
    title: "Detail d'un match",
    description:
      "Evenements (buts, cartons), statistiques et compositions d'un match donne. fixtureId = id renvoye par les autres outils.",
    inputSchema: {
      fixtureId: z.number().int().describe("ID api-sports du match (fixture)"),
    },
    annotations: RO,
  },
  async ({ fixtureId }) => {
    const json = await getJson(`/match/${fixtureId}`);
    const out: string[] = [`Detail du match ${fixtureId}`];

    const events = json.events || [];
    if (events.length) {
      out.push("\n## Evenements");
      for (const e of events) {
        const min = e.time?.elapsed ?? "?";
        const extra = e.time?.extra ? `+${e.time.extra}` : "";
        out.push(`${min}${extra}' ${e.team?.name ?? ""} — ${e.type}/${e.detail}: ${e.player?.name ?? ""}`);
      }
    }

    const stats = json.statistics || [];
    if (stats.length) {
      out.push("\n## Statistiques");
      for (const teamStats of stats) {
        out.push(`### ${teamStats.team?.name ?? "?"}`);
        for (const s of teamStats.statistics || []) {
          out.push(`- ${s.type} : ${s.value ?? "-"}`);
        }
      }
    }

    const lineups = json.lineups || [];
    if (lineups.length) {
      out.push("\n## Compositions");
      for (const l of lineups) {
        const xi = (l.startXI || []).map((p: any) => p.player?.name).filter(Boolean).join(", ");
        out.push(`### ${l.team?.name ?? "?"} (${l.formation ?? "?"})`);
        out.push(xi || "(non disponible)");
      }
    }

    if (out.length === 1) out.push("Aucune donnee disponible pour ce match.");
    return text(out.join("\n"));
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`info-foot MCP demarre (backend: ${BASE})`);
