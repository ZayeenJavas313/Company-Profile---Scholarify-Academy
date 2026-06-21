import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username & password wajib" }, { status: 400 });
    }

    // Panggil backend Django untuk validasi credensial
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

    try {
      console.log(`[Login API] Calling backend: ${baseUrl}/auth/login/`);
    const backendRes = await fetch(`${baseUrl}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        credentials: "include", // Penting untuk mengirim cookies (sessionid)
      body: JSON.stringify({ username, password }),
    });

      console.log(`[Login API] Backend response status: ${backendRes.status} ${backendRes.statusText}`);
      
      // Get response text first
      const responseText = await backendRes.text();
      console.log(`[Login API] Backend response status: ${backendRes.status} ${backendRes.statusText}`);
      console.log(`[Login API] Backend response text (full):`, responseText);
      
      let data: any = {};
      try {
        if (responseText) {
          data = JSON.parse(responseText);
          console.log(`[Login API] Parsed data:`, JSON.stringify(data, null, 2));
        } else {
          console.warn(`[Login API] Empty response text`);
        }
      } catch (parseError: any) {
        console.error("[Login API] Error parsing backend response:", parseError);
        console.error("[Login API] Response text that failed to parse:", responseText);
        return NextResponse.json(
          { error: `Backend error: Tidak bisa memparse response. Status: ${backendRes.status}` },
          { status: 500 }
        );
      }
      
      // Check if backend response is ok
      if (!backendRes.ok) {
        const msg = data?.error || `Backend error: ${backendRes.status} ${backendRes.statusText}`;
        console.error(`[Login API] Backend not ok (${backendRes.status}):`, msg);
        return NextResponse.json({ error: msg }, { status: backendRes.status || 500 });
      }
      
      // Check if data.ok exists and is true
      if (!data || !data.ok) {
        const msg = data?.error || "Login failed: invalid response format (missing 'ok' field)";
        console.error(`[Login API] Data.ok is false or missing. Full data:`, JSON.stringify(data, null, 2));
        return NextResponse.json({ error: msg }, { status: 401 });
      }
      
      // Check if user data exists
      if (!data.user) {
        console.error(`[Login API] User data missing in response. Full data:`, JSON.stringify(data, null, 2));
        return NextResponse.json({ error: "Invalid response: user data not found" }, { status: 500 });
    }
      
      console.log(`[Login API] Login successful! User:`, data.user);

    const payload = {
      username: data.user.username as string,
      name: (data.user.name as string) ?? data.user.username,
      role: (data.user.role as string) ?? "student",
    };

    const res = NextResponse.json({ ok: true, user: payload });
    // Secure cookie di production (HTTPS), false di development
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookies.set("session", JSON.stringify(payload), {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,    // true di production (HTTPS), false di development
      path: "/",
      maxAge: 60 * 60 * 8,     // 8 jam
    });

    return res;
    } catch (fetchError: any) {
      console.error("Error fetching backend:", fetchError);
      // Cek jika backend tidak bisa dijangkau
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch')) {
        return NextResponse.json(
          { error: "Backend server tidak dapat dijangkau. Pastikan backend Django berjalan di http://localhost:8000" },
          { status: 503 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat login" },
      { status: 400 }
    );
  }
}
