import { NextResponse, type NextRequest } from "next/server";
import { deviceCookie, isDapurKey } from "@/lib/dapur/access";

/**
 * Link rahasia Dapur: /dapur/buka?kunci=<DAPUR_KEY>
 * Kunci cocok → perangkat ini diingat (cookie), lalu diarahkan ke /dapur dengan alamat yang bersih.
 * Kunci salah / belum diatur → 404, sama seperti halaman yang tidak ada.
 */
export async function GET(request: NextRequest) {
  const cookie = deviceCookie();
  if (!cookie || !isDapurKey(request.nextUrl.searchParams.get("kunci") ?? "")) {
    return new Response("Not found", { status: 404 });
  }

  const destination = request.nextUrl.clone();
  destination.pathname = "/dapur";
  destination.search = "";

  const response = NextResponse.redirect(destination);
  response.cookies.set(cookie);
  // Alamat berisi kunci jangan sampai tersimpan di cache atau terkirim sebagai "referer"
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
