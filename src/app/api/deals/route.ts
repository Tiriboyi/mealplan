import { NextResponse, type NextRequest } from "next/server";
import { fetchDeals, PrijsProfeetError } from "@/lib/prijsprofeet";
import { RETAILERS, type PromoStatus } from "@/lib/retailers";

export const dynamic = "force-dynamic";

/**
 * GET /api/deals?retailers=jumbo,plus&status=active
 * The visitor's own PrijsProfeet key arrives in `x-prijsprofeet-key` and is only
 * forwarded upstream; it is never stored or logged. The server's key, if set, is the fallback.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const retailers = (params.get("retailers") ?? "").split(",").filter((r) => r in RETAILERS);
  if (retailers.length === 0) return NextResponse.json({ error: "Choose at least one retailer." }, { status: 400 });
  const status: PromoStatus = params.get("status") === "upcoming" ? "upcoming" : "active";

  const sent = req.headers.get("x-prijsprofeet-key")?.trim();
  const apiKey = (sent && /^[\x21-\x7e]{1,200}$/.test(sent) ? sent : undefined) ?? (process.env.PRIJSPROFEET_API_KEY || undefined);

  try {
    const perRetailer = await Promise.all(retailers.map((r) => fetchDeals(r, status, apiKey)));
    return NextResponse.json({ deals: perRetailer.flat(), usingKey: Boolean(apiKey) });
  } catch (err) {
    if (err instanceof PrijsProfeetError)
      return NextResponse.json({ error: err.message }, { status: err.status === 429 ? 429 : 502 });
    console.error(err);
    return NextResponse.json({ error: "Could not reach PrijsProfeet." }, { status: 502 });
  }
}
