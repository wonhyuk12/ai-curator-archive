import type { Metadata } from "next";
import { GameApp } from "@/components/game/GameApp";

export const metadata: Metadata = {
  title: "게임 만들기 AI 추천",
  description: "만들고 싶은 게임과 한 달 예산을 알려 주면 필요한 AI 툴 4개를 골라 드려요",
};

export default function GamePage() {
  return <GameApp />;
}
