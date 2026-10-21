// 키오스크용: ../curator(AI 큐레이터)를 public/news 로 복사해서 한 주소(/news)에서 같이 서비스해요.
// npm run dev / build 전에 자동으로 실행돼요. 원본은 curator/ 폴더이고, public/news 는 git 에 올리지 않아요.
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "curator");
const dest = join(here, "..", "public", "news");

if (!existsSync(src)) {
  console.warn("[sync-curator] ../curator 폴더가 없어서 건너뛰어요 (/news 없이 실행)");
} else {
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true, filter: (p) => !/(^|\/)(\.vercel|\.gitignore|README\.md)$/.test(p) });
  console.log("[sync-curator] curator → public/news 복사 완료");
}
