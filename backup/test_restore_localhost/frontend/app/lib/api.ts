// API utility untuk komunikasi dengan backend Django

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export interface Subtest {
  id: string;
  code: string;
  title: string;
  description: string;
  duration: number;
  questionCount: number;
}

export interface Question {
  id: string;
  soal_id?: number; // ID sebenarnya dari database (jika ada)
  subtestId: string;
  question: string;
  question_image?: string; // URL gambar soal (jika ada)
  options: Array<{ key: string; text: string }>;
  answer: string;
  explanation?: string;
}

/**
 * Fetch semua subtests dari backend
 */
export async function fetchSubtests(): Promise<Subtest[]> {
  try {
    const apiUrl = `${API_BASE_URL}/subtests/`;
    console.log("Fetching subtests from:", apiUrl);
    
    let response;
    try {
      response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (fetchError: any) {
      // Network error atau backend tidak bisa dijangkau
      console.error("Fetch error in fetchSubtests:", fetchError);
      const errorMessage = fetchError.message || "Unknown error";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        console.error(`Backend server tidak dapat dijangkau di ${API_BASE_URL.replace('/api', '')}`);
        console.error("Pastikan backend Django berjalan dan CORS sudah dikonfigurasi");
      }
      
      // Return empty array untuk prevent UI crash
      console.warn('Returning empty array due to network error');
      return [];
    }

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to fetch subtests: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
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

    const data = await response.json();
    console.log("Fetched subtests from API:", data.length, data);
    return data;
  } catch (error) {
    console.error('Error fetching subtests:', error);
    // Return empty array instead of throwing to prevent UI crash
    console.warn('Returning empty array due to error');
    return [];
  }
}

/**
 * Fetch questions untuk subtest tertentu
 * @param subtestCode - Kode subtest (e.g., "pu", "pm")
 * @param batchId - Optional batch ID untuk filter soal berdasarkan batch
 */
export async function fetchSubtestQuestions(subtestCode: string, batchId?: string): Promise<Question[]> {
  try {
    // Build URL with optional batch_id query parameter
    let url = `${API_BASE_URL}/subtests/${subtestCode}/questions/`;
    if (batchId) {
      url += `?batch_id=${encodeURIComponent(batchId)}`;
    }
    
    console.log("Fetching questions from:", url);
    
    let response;
    try {
      response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (fetchError: any) {
      // Network error atau backend tidak bisa dijangkau
      console.error("Fetch error in fetchSubtestQuestions:", fetchError);
      const errorMessage = fetchError.message || "Unknown error";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        console.error(`Backend server tidak dapat dijangkau di ${API_BASE_URL.replace('/api', '')}`);
        console.error("Pastikan backend Django berjalan dan CORS sudah dikonfigurasi");
      }
      
      // Return empty array untuk prevent UI crash
      console.warn('Returning empty array due to network error');
      return [];
    }

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to fetch questions: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
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

    const data = await response.json();
    console.log(`Fetched ${data.length} questions for subtest ${subtestCode}`);
    // Pastikan soal_id ada di setiap question
    return data.map((q: any) => ({
      ...q,
      soal_id: q.soal_id || q.id, // Gunakan soal_id jika ada, fallback ke id
    }));
  } catch (error) {
    console.error(`Error fetching questions for ${subtestCode}:`, error);
    // Return empty array instead of throwing to prevent UI crash
    console.warn('Returning empty array due to error');
    return [];
  }
}

/**
 * Submit jawaban user untuk suatu subtest
 */
export async function submitJawaban(
  username: string,
  subtestCode: string,
  batchId: string,
  jawaban: Record<string | number, string>,
  durasiDetik?: number
): Promise<{
  success: boolean;
  hasil: {
    id: number;
    subtest_code: string;
    subtest_nama: string;
    batch_id: string;
    jumlah_benar: number;
    jumlah_salah: number;
    jumlah_kosong: number;
    skor: number;
    waktu_selesai: string | null;
  };
}> {
  try {
    // Jawaban sudah dalam format {soal_id: "A"} atau {index: "A"}
    // Backend akan handle mapping jika perlu
    const jawabanFormatted: Record<string, string> = {};
    Object.entries(jawaban).forEach(([key, jawab]) => {
      // Konversi key ke string (bisa soal_id atau index)
      jawabanFormatted[String(key)] = jawab;
    });
    
    console.log("Submitting jawaban formatted:", {
      keys: Object.keys(jawabanFormatted).slice(0, 5),
      count: Object.keys(jawabanFormatted).length,
    });

    const response = await fetch(`${API_BASE_URL}/submit-jawaban/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        subtest_code: subtestCode,
        batch_id: batchId,
        jawaban: jawabanFormatted,
        durasi_detik: durasiDetik,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to submit answers: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting answers:', error);
    throw error;
  }
}

/**
 * Fetch riwayat nilai untuk user tertentu
 */
export async function fetchRiwayatNilai(username: string): Promise<Array<{
  id: number;
  batch_id: string;
  subtest_code: string;
  subtest_nama: string;
  jumlah_benar: number;
  jumlah_salah: number;
  jumlah_kosong: number;
  skor: number;
  waktu_selesai: string | null;
  tanggal: string;
}>> {
  try {
    const apiUrl = `${API_BASE_URL}/riwayat-nilai/${username}/`;
    console.log("Fetching riwayat nilai from:", apiUrl);
    
    let response;
    try {
      response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (fetchError: any) {
      // Network error atau backend tidak bisa dijangkau
      console.error("Fetch error in fetchRiwayatNilai:", fetchError);
      const errorMessage = fetchError.message || "Unknown error";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        console.error(`Backend server tidak dapat dijangkau di ${API_BASE_URL.replace('/api', '')}`);
        console.error("Pastikan backend Django berjalan dan CORS sudah dikonfigurasi");
      }
      
      // Return empty array untuk prevent UI crash
      console.warn('Returning empty array due to network error');
      return [];
    }

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to fetch history: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
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

    const data = await response.json();
    console.log("Fetched riwayat nilai from API:", data.length, "records");
    return data;
  } catch (error) {
    console.error('Error fetching history:', error);
    // Return empty array instead of throwing to prevent UI crash
    console.warn('Returning empty array due to error');
    return [];
  }
}




/**
 * Fetch semua batches dari backend (public endpoint)
 */
export async function fetchBatches(): Promise<Array<{
  id: number;
  batch_id: string;
  title: string;
  date: string;
  date_display: string;
  deadline?: string;
  deadline_display?: string;
  status: 'available' | 'locked';
  description: string;
  duration?: number;
  subtests_info?: Array<{ code: string; title: string }>;
}>> {
  try {
    const apiUrl = `${API_BASE_URL}/batches/`;
    console.log("Fetching batches from:", apiUrl);
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (fetchError: any) {
      // Network error atau backend tidak bisa dijangkau
      console.error("Fetch error:", fetchError);
      const errorMessage = fetchError.message || "Unknown error";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        console.error(`Backend server tidak dapat dijangkau di ${API_BASE_URL.replace('/api', '')}`);
        console.error("Pastikan backend Django berjalan dan CORS sudah dikonfigurasi");
      }
      
      // Return empty array untuk prevent UI crash
      console.warn('Returning empty array due to network error');
      return [];
    }

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to fetch batches: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
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

    const data = await response.json();
    console.log("Fetched batches from API:", data.length, data);
    return data;
  } catch (error) {
    console.error('Error fetching batches:', error);
    // Return empty array instead of throwing to prevent UI crash
    console.warn('Returning empty array due to error');
    return [];
  }
}
