import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "키오스크 분석 — 관리자",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
