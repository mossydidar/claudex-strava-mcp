const STRAVA_BASE_URL = "https://www.strava.com/api/v3";
const TOKEN_URL = "https://www.strava.com/api/v3/oauth/token";

let accessToken: string | null = null;
let tokenExpiresAt = 0;
let currentRefreshToken = "";

async function refreshAccessToken(): Promise<void> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = currentRefreshToken || process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, or STRAVA_REFRESH_TOKEN in .env"
    );
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_at: number;
    refresh_token: string;
  };

  accessToken = data.access_token;
  tokenExpiresAt = data.expires_at;
  currentRefreshToken = data.refresh_token;
}

async function ensureValidToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (!accessToken || tokenExpiresAt - now < 60) {
    await refreshAccessToken();
  }
  return accessToken!;
}

export async function stravaGet<T = unknown>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const token = await ensureValidToken();

  const url = new URL(`${STRAVA_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Strava API error (${response.status} ${path}): ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}
