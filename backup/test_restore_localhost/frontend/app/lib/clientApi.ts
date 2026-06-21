// clientApi.ts - browser-safe API helpers for client components
const API_BASE = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL
  : '/api';

export async function submitJawaban(
  username: string,
  subtestCode: string,
  batchId: string,
  jawaban: Record<string | number, string>,
  durasiDetik?: number
) {
  const jawabanFormatted: Record<string, string> = {};
  Object.entries(jawaban).forEach(([key, jawab]) => {
    jawabanFormatted[String(key)] = String(jawab);
  });

  const res = await fetch(`${API_BASE}/submit-jawaban/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      subtest_code: subtestCode,
      batch_id: batchId,
      jawaban: jawabanFormatted,
      durasi_detik: durasiDetik,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to submit answers: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchRiwayatNilai(username: string) {
  try {
    const apiUrl = `${API_BASE}/riwayat-nilai/${username}/`;
    console.log("Fetching riwayat nilai from:", apiUrl);
    
    let res;
    try {
      res = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (fetchError: any) {
      // Network error atau backend tidak bisa dijangkau
      console.error("Fetch error in fetchRiwayatNilai:", fetchError);
      const errorMessage = fetchError.message || "Unknown error";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        console.error(`Backend server tidak dapat dijangkau di ${API_BASE.replace('/api', '')}`);
        console.error("Pastikan backend Django berjalan dan CORS sudah dikonfigurasi");
      }
      
      // Return empty array untuk prevent UI crash
      console.warn('Returning empty array due to network error');
      return [];
    }

    if (!res.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to fetch history: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await res.text();
          if (text) {
            errorMessage = text.substring(0, 200);
          }
        } catch (textError) {
          // Ignore text parsing error
        }
      }
      console.error("Error response:", errorMessage);
      // Return empty array instead of throwing to prevent UI crash
      console.warn('Returning empty array due to error response');
      return [];
    }

    const data = await res.json();
    console.log("Fetched riwayat nilai from API:", data.length, "records");
    return data;
  } catch (error) {
    console.error('Error fetching history:', error);
    // Return empty array instead of throwing to prevent UI crash
    console.warn('Returning empty array due to error');
    return [];
  }
}

export default {};
