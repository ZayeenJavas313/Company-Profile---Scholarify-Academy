// data/users.ts
export type User = {
  username: string;
  password: string; // plain untuk demo. production: hash!
  name: string;
  role?: "student" | "admin";
};

export const users: User[] = [
  { username: "demo", password: "demo123", name: "Demo User", role: "student" },
  { username: "admin", password: "admin123", name: "Admin", role: "admin" },
];
