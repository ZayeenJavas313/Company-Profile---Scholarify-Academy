import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  // Pastikan nama cookie sama dengan yang diset di /api/login (yaitu "session")
  const raw = cookieStore.get("session")?.value;

  if (!raw) {
    // belum login
    console.log("[Check Session] No session cookie found");
    return NextResponse.json({ ok: false });
  }

  try {
    const session = JSON.parse(raw) as {
      username: string;
      name: string;
      role?: string;
    };

    console.log("[Check Session] Session found:", session);
    // sekarang API juga mengirim user
    return NextResponse.json({ ok: true, user: session });
  } catch (error) {
    console.error("[Check Session] Error parsing session cookie:", error);
    return NextResponse.json({ ok: false });
  }
}
