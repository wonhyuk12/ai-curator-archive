import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 저장소 맨 위에도 package-lock.json 이 있어서, 이 앱 폴더를 루트로 지정
  turbopack: { root: path.join(__dirname) },
  // 키오스크: AI 큐레이터를 /news 에서 같이 서비스 (scripts/sync-curator.mjs 가 public/news 로 복사)
  async redirects() {
    return [{ source: "/news", destination: "/news/index.html", permanent: false }];
  },
};

export default nextConfig;
