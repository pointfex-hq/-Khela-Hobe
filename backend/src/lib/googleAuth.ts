import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const OAUTH_SIGNING_SECRET =
  process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-123456789';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendUrl: string;
  backendUrl: string;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const redirectUri = (
    process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/api/v1/auth/google/callback`
  ).trim();

  return {
    clientId,
    clientSecret,
    redirectUri,
    frontendUrl,
    backendUrl,
  };
}

export function isGoogleOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  return Boolean(clientId && clientSecret);
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
}

export function signOAuthPayload<T extends object>(payload: T, ttlSeconds = 300): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = base64UrlEncode(
    JSON.stringify({ ...payload, nonce: randomBytes(8).toString('hex'), exp })
  );
  const sig = base64UrlEncode(
    createHmac('sha256', OAUTH_SIGNING_SECRET).update(body).digest()
  );
  return `${body}.${sig}`;
}

export function verifyOAuthPayload<T extends { exp?: number }>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expectedSig = base64UrlEncode(
      createHmac('sha256', OAUTH_SIGNING_SECRET).update(body).digest()
    );
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const decoded = JSON.parse(base64UrlDecode(body)) as T;
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function buildGoogleAuthUrl(state: string): string {
  const cfg = getGoogleOAuthConfig();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', cfg.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('state', state);
  return url.toString();
}

export interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const cfg = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed (${res.status}): ${errText}`);
  }

  return (await res.json()) as GoogleTokenResponse;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google user profile (${res.status})`);
  }

  return (await res.json()) as GoogleUserInfo;
}
