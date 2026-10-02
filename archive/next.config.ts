import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 저장소 맨 위에도 package-lock.json 이 있어서, 이 앱 폴더를 루트로 지정
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
