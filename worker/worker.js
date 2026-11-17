// Cloudflare Worker: Google 뉴스 RSS 전용 CORS 프록시
// 사용법: ?url=<인코딩된 https://news.google.com/rss/... 주소>
const ALLOWED_ORIGIN = "https://leekang-hyun.github.io";

export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const target = new URL(request.url).searchParams.get("url");
    let u;
    try { u = new URL(target); } catch { return new Response("bad url", { status: 400, headers: cors }); }
    // 오남용 방지: Google 뉴스 RSS 주소만 허용
    if (u.protocol !== "https:" || u.hostname !== "news.google.com" || !u.pathname.startsWith("/rss")) {
      return new Response("forbidden", { status: 403, headers: cors });
    }

    const upstream = await fetch(u.href, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; news-page)" },
      cf: { cacheTtl: 600, cacheEverything: true },   // Cloudflare에서 10분 캐시
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  },
};
