import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

export type AccountRow = {
  id: number;
  game_name: string;
  tag_line: string;
  region_cluster: string | null;
  sort_order: number;
  created_at: string;
};

export type AccountSnapshotRow = {
  id: number;
  account_id: number;
  captured_at: number;
  puuid: string | null;
  solo_rank: string | null;
  flex_rank: string | null;
  solo_icon_url: string | null;
  flex_icon_url: string | null;
  level: number | null;
  profile_icon_id: number | null;
  display_name: string | null;
  region_label: string | null;
  solo_wins: number | null;
  solo_losses: number | null;
  flex_wins: number | null;
  flex_losses: number | null;
  /** Última vez que se llamó a account + summoner (perfil / icono / nivel). TTL ~3 días. */
  profile_fetched_at?: number | null;
  /** Versión Data Dragon usada para URLs de iconos en /home (sin fetch al cliente). */
  ddragon_version?: string | null;
  solo_matches_json?: string | null;
  flex_matches_json?: string | null;
  solo_streak_json?: string | null;
  flex_streak_json?: string | null;
};

export type MatchupNoteRow = {
  champion_slug: string;
  opponent_slug: string;
  body: string;
  updated_at: number;
};

/** Caché local del top campeones (sin llamar a Riot al leer). */
export type ChampionAggregateStoredPayload = {
  seasonYear: number;
  queues: string[];
  perAccountMaxDetailCalls: number;
  truncated: boolean;
  accountNotes: {
    label: string;
    detailCalls: number;
    truncated: boolean;
    skipped?: string;
  }[];
  errors: string[];
  top: {
    rank: number;
    champion: string;
    championId: number | null;
    iconUrl: string | null;
    games: number;
    wins: number;
    losses: number;
    winRate: number;
  }[];
};

let dbSingleton: Database.Database | null = null;

function getDbPath(): string {
  const envPath = process.env.SQLITE_PATH;
  if (envPath) return envPath;
  return path.join(process.cwd(), "data", "app.db");
}

export function getDb(): Database.Database {
  if (dbSingleton) return dbSingleton;
  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  seedDefaultAccounts(db);
  dbSingleton = db;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_name TEXT NOT NULL,
      tag_line TEXT NOT NULL,
      region_cluster TEXT DEFAULT 'euw1',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_riot ON accounts(game_name, tag_line);

    CREATE TABLE IF NOT EXISTS account_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      captured_at INTEGER NOT NULL,
      puuid TEXT,
      solo_rank TEXT,
      flex_rank TEXT,
      solo_icon_url TEXT,
      flex_icon_url TEXT,
      level INTEGER,
      profile_icon_id INTEGER,
      display_name TEXT,
      region_label TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_account_time ON account_snapshots(account_id, captured_at DESC);

    CREATE TABLE IF NOT EXISTS matchup_notes (
      champion_slug TEXT NOT NULL,
      opponent_slug TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (champion_slug, opponent_slug)
    );

    CREATE TABLE IF NOT EXISTS champion_aggregate_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      captured_at INTEGER NOT NULL,
      season_year INTEGER NOT NULL,
      per_account_max INTEGER NOT NULL,
      truncated INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT NOT NULL
    );
  `);
  try {
    db.exec(`ALTER TABLE account_snapshots ADD COLUMN region_label TEXT`);
  } catch {
    /* column exists */
  }
  for (const col of [
    "ALTER TABLE account_snapshots ADD COLUMN solo_wins INTEGER",
    "ALTER TABLE account_snapshots ADD COLUMN solo_losses INTEGER",
    "ALTER TABLE account_snapshots ADD COLUMN flex_wins INTEGER",
    "ALTER TABLE account_snapshots ADD COLUMN flex_losses INTEGER",
    "ALTER TABLE account_snapshots ADD COLUMN profile_fetched_at INTEGER",
    "ALTER TABLE account_snapshots ADD COLUMN ddragon_version TEXT",
    "ALTER TABLE account_snapshots ADD COLUMN solo_matches_json TEXT",
    "ALTER TABLE account_snapshots ADD COLUMN flex_matches_json TEXT",
    "ALTER TABLE account_snapshots ADD COLUMN solo_streak_json TEXT",
    "ALTER TABLE account_snapshots ADD COLUMN flex_streak_json TEXT",
  ]) {
    try {
      db.exec(col);
    } catch {
      /* column exists */
    }
  }
}

const DEFAULT_ACCOUNTS: { game_name: string; tag_line: string; sort_order: number }[] = [
  { game_name: "El Dios Degryh", tag_line: "EUW", sort_order: 1 },
  { game_name: "Dark Degryh", tag_line: "EUW", sort_order: 2 },
  { game_name: "Dark Hielo", tag_line: "EUW", sort_order: 3 },
  { game_name: "Degryh OTP Rengo", tag_line: "EUW", sort_order: 4 },
  { game_name: "HieloBazuco", tag_line: "ESP", sort_order: 5 },
  { game_name: "GRV Degryh", tag_line: "ESP", sort_order: 6 },
  { game_name: "Degryhlol", tag_line: "EUW", sort_order: 7 },
];

function seedDefaultAccounts(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM accounts").get() as { c: number };
  if (count.c > 0) return;
  const insert = db.prepare(
    "INSERT INTO accounts (game_name, tag_line, region_cluster, sort_order) VALUES (?, ?, 'euw1', ?)"
  );
  const run = db.transaction(() => {
    for (const a of DEFAULT_ACCOUNTS) {
      insert.run(a.game_name, a.tag_line, a.sort_order);
    }
  });
  run();
}

export function listAccounts(): AccountRow[] {
  return getDb()
    .prepare("SELECT * FROM accounts ORDER BY sort_order ASC, id ASC")
    .all() as AccountRow[];
}

export function getChampionAggregateCache(): {
  capturedAt: number;
  payload: ChampionAggregateStoredPayload;
} | null {
  const row = getDb()
    .prepare(
      `SELECT captured_at, payload_json FROM champion_aggregate_cache WHERE id = 1 LIMIT 1`
    )
    .get() as { captured_at: number; payload_json: string } | undefined;
  if (!row?.payload_json) return null;
  try {
    const payload = JSON.parse(row.payload_json) as ChampionAggregateStoredPayload;
    if (!payload || typeof payload.seasonYear !== "number" || !Array.isArray(payload.top)) return null;
    return { capturedAt: row.captured_at, payload };
  } catch {
    return null;
  }
}

export function upsertChampionAggregateCache(opts: {
  capturedAt: number;
  payload: ChampionAggregateStoredPayload;
}) {
  const { capturedAt, payload } = opts;
  getDb()
    .prepare(
      `INSERT INTO champion_aggregate_cache (id, captured_at, season_year, per_account_max, truncated, payload_json)
       VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         captured_at = excluded.captured_at,
         season_year = excluded.season_year,
         per_account_max = excluded.per_account_max,
         truncated = excluded.truncated,
         payload_json = excluded.payload_json`
    )
    .run(
      capturedAt,
      payload.seasonYear,
      payload.perAccountMaxDetailCalls,
      payload.truncated ? 1 : 0,
      JSON.stringify(payload)
    );
}

export function updateAccountRegionCluster(accountId: number, regionCluster: string | null) {
  if (!regionCluster || !/^[a-z0-9]+$/i.test(regionCluster)) return;
  getDb()
    .prepare("UPDATE accounts SET region_cluster = ? WHERE id = ?")
    .run(regionCluster.toLowerCase(), accountId);
}

export function getLatestSnapshot(accountId: number): AccountSnapshotRow | null {
  const row = getDb()
    .prepare(
      `SELECT * FROM account_snapshots WHERE account_id = ? ORDER BY captured_at DESC LIMIT 1`
    )
    .get(accountId) as AccountSnapshotRow | undefined;
  return row ?? null;
}

export function insertSnapshot(
  accountId: number,
  data: Omit<AccountSnapshotRow, "id" | "account_id">
) {
  getDb()
    .prepare(
      `INSERT INTO account_snapshots (
        account_id, captured_at, puuid, solo_rank, flex_rank, solo_icon_url, flex_icon_url,
        level, profile_icon_id, display_name, region_label,
        solo_wins, solo_losses, flex_wins, flex_losses,
        profile_fetched_at, ddragon_version,
        solo_matches_json, flex_matches_json, solo_streak_json, flex_streak_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      accountId,
      data.captured_at,
      data.puuid,
      data.solo_rank,
      data.flex_rank,
      data.solo_icon_url,
      data.flex_icon_url,
      data.level,
      data.profile_icon_id,
      data.display_name,
      data.region_label,
      data.solo_wins ?? null,
      data.solo_losses ?? null,
      data.flex_wins ?? null,
      data.flex_losses ?? null,
      data.profile_fetched_at ?? null,
      data.ddragon_version ?? null,
      data.solo_matches_json ?? null,
      data.flex_matches_json ?? null,
      data.solo_streak_json ?? null,
      data.flex_streak_json ?? null
    );
}

export function listMatchupNotesForChampion(championSlug: string): MatchupNoteRow[] {
  return getDb()
    .prepare(
      "SELECT champion_slug, opponent_slug, body, updated_at FROM matchup_notes WHERE champion_slug = ? ORDER BY opponent_slug"
    )
    .all(championSlug) as MatchupNoteRow[];
}

export function getMatchupNote(
  championSlug: string,
  opponentSlug: string
): MatchupNoteRow | null {
  const row = getDb()
    .prepare(
      "SELECT champion_slug, opponent_slug, body, updated_at FROM matchup_notes WHERE champion_slug = ? AND opponent_slug = ?"
    )
    .get(championSlug, opponentSlug) as MatchupNoteRow | undefined;
  return row ?? null;
}

export function upsertMatchupNote(
  championSlug: string,
  opponentSlug: string,
  body: string
) {
  const now = Date.now();
  getDb()
    .prepare(
      `INSERT INTO matchup_notes (champion_slug, opponent_slug, body, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(champion_slug, opponent_slug) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`
    )
    .run(championSlug, opponentSlug, body, now);
}
