// frontend/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Arahkan root ke landing statis agar tidak tersentuh layout/stylesheet tryout
  redirect("/landing/index.html");
}
