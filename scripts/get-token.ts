/**
 * One-time helper to get a valid Strava refresh token.
 *
 * Usage:
 *   1. Run: npx tsx scripts/get-token.ts
 *   2. Open the URL it prints in your browser
 *   3. Authorize the app — you'll be redirected to localhost
 *   4. The script exchanges the code and prints your tokens
 *   5. Copy the refresh_token into your .env file
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createServer } from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env") });

const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET in .env");
  process.exit(1);
}

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = "read,activity:read_all,profile:read_all";

const authUrl =
  `https://www.strava.com/oauth/authorize` +
  `?client_id=${clientId}` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${SCOPES}` +
  `&approval_prompt=auto`;

console.log("\n=== Strava OAuth Token Helper ===\n");
console.log("1. Open this URL in your browser:\n");
console.log(`   ${authUrl}\n`);
console.log("2. Authorize the app, then wait...\n");

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);

  if (url.pathname !== "/callback") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400);
    res.end("Missing code parameter");
    return;
  }

  try {
    const tokenRes = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      res.writeHead(500);
      res.end("Token exchange failed: " + JSON.stringify(data));
      console.error("Token exchange failed:", data);
      server.close();
      return;
    }

    const result = data as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      athlete: { id: number; firstname: string; lastname: string };
    };

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Success!</h1><p>You can close this tab. Check the terminal for your tokens.</p>");

    console.log("=== Success! ===\n");
    console.log(`Athlete: ${result.athlete.firstname} ${result.athlete.lastname} (ID: ${result.athlete.id})`);
    console.log(`\nUpdate your .env with:\n`);
    console.log(`STRAVA_REFRESH_TOKEN=${result.refresh_token}`);
    console.log();

    server.close();
  } catch (err) {
    res.writeHead(500);
    res.end("Error: " + String(err));
    console.error(err);
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT} for callback...\n`);
});
