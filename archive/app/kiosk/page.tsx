import type { Metadata } from "next";
import { KioskStart } from "@/components/kiosk/KioskStart";

export const metadata: Metadata = {
  title: "AI 키오스크",
};

export default function KioskPage() {
  return <KioskStart />;
}
