import crypto from "crypto";
import { NextResponse } from "next/server";
import { env } from "@/config/env";

const COOKIE_NAME = "koito_admin_session";
const TOKEN_MAX_AGE = 60 * 60 * 2; // 2 hours

interface AdminSessionPayload {
  sub: string;
  name: string;
  iat: number;
  exp: number;
}

function base64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signPayload(payload: string) {
  const secret = env.ADMIN_AUTH_SECRET;
  if (!secret) {
    throw new Error("ADMIN_AUTH_SECRET environment variable is required for admin auth.");
  }
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}

function serializeToken(payload: AdminSessionPayload) {
  const encoded = base64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const signature = base64url(Buffer.from(signPayload(encoded), "utf8"));
  return `${encoded}.${signature}`;
}

function parseToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = base64url(Buffer.from(signPayload(encoded), "utf8"));
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (!name) return;
    cookies[name] = rest.join("=");
  });
  return cookies;
}

export function createAdminToken(adminId: string, name: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: adminId,
    name,
    iat: now,
    exp: now + TOKEN_MAX_AGE,
  };
  return serializeToken(payload);
}

export function verifyAdminToken(token: string) {
  const payload = parseToken(token);
  if (!payload) return null;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;
  return payload;
}

export function getAdminTokenFromRequest(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[COOKIE_NAME];
}

export function requireAdminAuth(request: Request) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export function setAdminAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: "/",
    maxAge: TOKEN_MAX_AGE,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function clearAdminAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
