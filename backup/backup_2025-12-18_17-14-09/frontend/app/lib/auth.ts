// lib/auth.ts
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('session');
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('session');
  return session ? JSON.parse(session).user : null;
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('session');
  window.location.href = '/login';
}