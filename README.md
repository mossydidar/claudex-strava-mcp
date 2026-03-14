# claudex-strava-mcp

A Model Context Protocol (MCP) server that connects Claude to your Strava fitness data. Ask Claude questions about your real training history in plain English — no dashboards, no manual exports.

Built with TypeScript, the MCP SDK, and Zod schema validation. Automatic OAuth token refresh included.

---

## What you can ask Claude

- *"How many walks did I do this month?"*
- *"Where were my last 3 activities?"*
- *"How do my 2025 and 2026 activity counts compare?"*
- *"Which of my activities had the most stop time?"*
- *"Am I hitting my Zone 2 training targets?"*

---

## Prerequisites

- Node.js 18+
- A [Strava](https://www.strava.com) account with activities
- A Strava API app ([create one here](https://www.strava.com/settings/api))
- [Claude Desktop](https://claude.ai/download) (or any MCP-compatible client)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/claudex-strava-mcp
cd claudex-strava-mcp
npm install
```

### 2. Create your Strava API app

Go to [strava.com/settings/api](https://www.strava.com/settings/api) and create an app. Set the **Authorization Callback Domain** to `localhost`.

You'll receive a **Client ID** and **Client Secret** — keep these safe.

### 3. Get your refresh token

Copy the example env file and fill in your Client ID and Secret:

```bash
cp .env.example .env
# Edit .env and add your STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET
```

Then run the OAuth helper:

```bash
npx tsx scripts/get-token.ts
```

This will:
1. Print an authorization URL — open it in your browser
2. Ask you to authorize the app on Strava
3. Redirect to localhost and exchange the code for tokens
4. Print your `STRAVA_REFRESH_TOKEN` in the terminal

Copy the printed refresh token into your `.env`:

```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token
```

### 4. Build the server

```bash
npm run build
```

This compiles TypeScript to `dist/`.

### 5. Configure Claude Desktop

Add the following to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "strava": {
      "command": "node",
      "args": ["/absolute/path/to/claudex-strava-mcp/dist/index.js"],
      "env": {
        "STRAVA_CLIENT_ID": "your_client_id",
        "STRAVA_CLIENT_SECRET": "your_client_secret",
        "STRAVA_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

Restart Claude Desktop. The Strava tools will appear in Claude's tool list.

---

## Project structure

```
claudex-strava-mcp/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── strava-client.ts   # Strava API client with auto token refresh
│   └── tools.ts           # 8 MCP tool definitions (Zod-validated)
├── scripts/
│   └── get-token.ts       # One-time OAuth token helper
├── .env.example           # Template — copy to .env and fill in values
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Available tools

| Tool | Description |
|------|-------------|
| `get_athlete_profile` | Your Strava profile and preferences |
| `get_athlete_stats` | All-time, YTD, and recent totals by sport |
| `list_activities` | Paginated activity list with date filters |
| `get_activity` | Detailed stats for a single activity |
| `get_activity_laps` | Lap-by-lap breakdown |
| `get_activity_zones` | Heart rate zone distribution |
| `list_routes` | Your saved routes |
| `get_route` | Detailed route info |

---

## How it works

The server uses the MCP SDK's `McpServer` class and registers tools using Zod schemas for runtime validation. The Strava client handles OAuth token refresh automatically — if your access token is within 60 seconds of expiring, it refreshes using your stored refresh token before making any API call.

```
Claude prompt
    │
    ▼
MCP Tool Layer (TypeScript)
    │
    ├── list_activities  ──► GET /athlete/activities
    ├── get_activity     ──► GET /activities/{id}
    ├── get_activity_zones ► GET /activities/{id}/zones
    └── ...
    │
    ▼
Strava API
    │
    ▼
Structured JSON → Claude reasons → Natural language response
```

---

## Development

```bash
npm run dev   # Watch mode — recompiles on save
npm run build # Production build
npm start     # Run compiled server
```

---

## Security notes

- Never commit your `.env` file — it's in `.gitignore`
- Rotate your Strava client secret at [strava.com/settings/api](https://www.strava.com/settings/api) if it's ever exposed
- The OAuth scopes requested are `read`, `activity:read_all`, and `profile:read_all` — read-only access only

---

## License

MIT

---

*Built by [Mostafa Didar Mahdi](https://linkedin.com/in/mostafa-didar) — Data Scientist, Anthropic-certified AI practitioner, Adelaide.*
