/**
 * WagerAttack Proxy - Cloudflare Worker (v3)
 * Deploy at: https://wa-proxy.mahmoudwakil89.workers.dev
 *
 * Fixes vs v2:
 *  - Reliably forwards the POST body (reads once, reuses)
 *  - Sets complete browser-like headers (Origin, Referer, UA, Accept, Accept-Language)
 *  - Overrides Host (Cloudflare respects this via the URL itself)
 *  - Preserves Authorization header for bearer calls
 *  - Adds full CORS support (OPTIONS preflight + all methods)
 *  - Returns upstream status + body unchanged so the client sees real error text
 */

const UPSTREAM = "https://wager.wagerattack.ag";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const upstreamUrl = UPSTREAM + url.pathname + url.search;

    // Read body once (text preserves form-url-encoded data perfectly)
    let body = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.text();
    }

    // Build browser-like headers
    const h = new Headers();
    h.set("Content-Type", request.headers.get("Content-Type") || "application/x-www-form-urlencoded");
    h.set("Origin", "https://wager.wagerattack.ag");
    h.set("Referer", "https://wager.wagerattack.ag/");
    h.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    h.set("Accept", "application/json, text/plain, */*");
    h.set("Accept-Language", "en-US,en;q=0.9");
    const auth = request.headers.get("Authorization");
    if (auth) h.set("Authorization", auth);

    let upstreamResp;
    try {
      upstreamResp = await fetch(upstreamUrl, {
        method: request.method,
        headers: h,
        body,
        redirect: "follow",
      });
    } catch (err) {
      return new Response(JSON.stringify({
        proxyError: true,
        message: "Upstream fetch failed",
        detail: String(err),
      }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }

    // Pass through body + status, add CORS
    const respBody = await upstreamResp.text();
    const respHeaders = new Headers({ ...CORS });
    const ct = upstreamResp.headers.get("Content-Type");
    if (ct) respHeaders.set("Content-Type", ct);

    return new Response(respBody, {
      status: upstreamResp.status,
      statusText: upstreamResp.statusText,
      headers: respHeaders,
    });
  },
};
