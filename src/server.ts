import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const SUPABASE_ORIGIN = (process.env["VITE_SUPABASE_URL"] ?? "https://*.supabase.co").replace(
  /\/+$/,
  "",
);
const SUPABASE_WS = SUPABASE_ORIGIN.replace(/^https:/, "wss:");

const BASE_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_WS} https://*.supabase.co wss://*.supabase.co`,
].join("; ");

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Buffer.from(bytes).toString("base64");
}

function strictCsp(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `style-src 'self' 'nonce-${nonce}'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_WS} https://*.supabase.co wss://*.supabase.co`,
  ].join("; ");
}

function addNonceToInlineResources(html: string, nonce: string): string {
  return html
    .replace(/<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)([^>]*)>/gi, `<script nonce="${nonce}"$1>`)
    .replace(/<style(?![^>]*\bnonce=)([^>]*)>/gi, `<style nonce="${nonce}"$1>`);
}

// The Lovable editor renders the app inside an iframe, so frame blocking is
// applied only on the published site, never on preview/sandbox hosts.
function isEmbeddablePreviewHost(request: Request): boolean {
  try {
    const host = new URL(request.url).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.includes("id-preview--") ||
      host.endsWith("-dev.lovable.app") ||
      host.includes("sandbox")
    );
  } catch {
    return true;
  }
}

async function withSecurityHeaders(request: Request, response: Response): Promise<Response> {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  const isPreview = isEmbeddablePreviewHost(request);
  let body: BodyInit | null = response.body;

  if (isPreview) {
    headers.set(
      "Content-Security-Policy",
      BASE_CSP.replace("frame-ancestors 'none'", "frame-ancestors *"),
    );
  } else {
    headers.set("X-Frame-Options", "DENY");
    // Inline bootstrap scripts/styles emitted by the SSR renderer (including the
    // runtime config the app needs) must keep working on the published site, so
    // the published policy stays on the permissive base CSP.
    headers.set("Content-Security-Policy", BASE_CSP);
  }

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await withSecurityHeaders(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return await withSecurityHeaders(
        request,
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
