/**
 * 툴 비교 자료 — 같은 분야 툴끼리 "몇 개 중 몇 위"로 비교할 때 쓰는 실제 측정값.
 *  - 실력: 그 작업을 직접 재는 공개 측정 (LMArena·Artificial Analysis). 툴 안에서 쓸 수 있는 모델 중 점수가 가장 높은 것 기준
 *    (entry = 측정표의 모델 이름, 유료 요금제에서만 쓸 수 있는 모델일 수 있어요). 측정이 없는 툴은 비워 둬요
 *  - 이용자: Similarweb 최근 3개월 웹사이트 방문 합계 (2026년 7~9월, 모든 툴 공통)
 *  - 비용: 공식 요금 페이지의 무료 시작 여부와 가장 싼 개인 유료 요금 (미국 달러, 월 결제)
 * 값을 확인하지 못하면 null — 화면에는 "공개 측정 없음"으로 보여요.
 */
import type { ToolKey } from "./archive";

export const METRICS_CHECKED = "2026-10-24";

export type Board = "text" | "webdev" | "vision" | "image" | "imageEdit" | "video" | "music" | "tts" | "search";

export interface BoardInfo {
  /** 화면에 쓰는 이름 (예: "이미지 만들기 점수") */
  name: string;
  /** 누가 무엇으로 쟀는지 */
  by: string;
  url: string;
  updated: string;
}

export interface SkillScore {
  /** 측정표에 적힌 모델 이름 */
  entry: string;
  score: number;
  rank: number;
}

export interface ToolMetric {
  domain?: string;
  /** Similarweb 최근 3개월 방문 합계 */
  visits?: number | null;
  month?: string;
  /** 돈을 내지 않고 쓸 수 있는지 (무료 체험만 있으면 false) */
  freeStart?: boolean | null;
  freeWhat?: string;
  /** 가장 싼 개인 유료 요금제 (미국 달러, 월) */
  paidFrom?: number | null;
  paidName?: string;
  annualOnly?: boolean;
  priceUrl?: string;
}

export const BOARDS: Partial<Record<Board, BoardInfo>> = {
  text: { name: "대화 실력 점수", by: "LMArena 텍스트 대화 투표", url: "https://arena.ai/leaderboard/text", updated: "2026-10-23" },
  webdev: { name: "웹 화면 만들기 점수", by: "LMArena WebDev 투표", url: "https://arena.ai/leaderboard/webdev", updated: "2026-10-22" },
  image: { name: "이미지 만들기 점수", by: "LMArena 이미지 만들기 투표", url: "https://arena.ai/leaderboard/text-to-image", updated: "2026-10-08" },
  imageEdit: { name: "이미지 편집 점수", by: "LMArena 이미지 편집 투표", url: "https://arena.ai/leaderboard/image-edit", updated: "2026-10-20" },
  video: { name: "영상 만들기 점수", by: "LMArena 영상 만들기 투표", url: "https://arena.ai/leaderboard/text-to-video", updated: "2026-09-22" },
  music: { name: "음악 만들기 점수", by: "Artificial Analysis 음악 아레나(연주곡)", url: "https://artificialanalysis.ai/music/leaderboard/instrumental", updated: "2026-10-24" },
  tts: { name: "음성 만들기 점수", by: "Artificial Analysis 음성 합성 아레나", url: "https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice", updated: "2026-10-24" },
  search: { name: "검색 답변 점수", by: "LMArena 검색 투표", url: "https://arena.ai/leaderboard/search", updated: "2026-10-13" },
};

export const TOOL_METRICS: Partial<Record<ToolKey, ToolMetric>> = {
  adcreative: { domain: "adcreative.ai", visits: 389300, freeStart: false, paidFrom: 39, paidName: "Starter", priceUrl: "https://www.adcreative.ai/#new-pricing-section" },
  adobeexpress: { domain: "express.adobe.com", visits: 24000000, freeStart: true, freeWhat: "템플릿·5GB 저장공간·일부 AI", paidFrom: 9.99, paidName: "Adobe Express Premium", priceUrl: "https://www.adobe.com/express/pricing" },
  adobepodcast: { domain: "podcast.adobe.com", visits: 11000000, freeStart: true, paidFrom: 19.99, paidName: "Adobe Firefly Pro (incl. Podcast Premium)", priceUrl: "https://podcast.adobe.com/en/" },
  aistudio: { domain: "aistudio.google.com", visits: 110400000, freeStart: true, freeWhat: "AI Studio 전 지역 무료 사용", priceUrl: "https://ai.google.dev/pricing" },
  artbreeder: { domain: "artbreeder.com", visits: 312000, freeStart: true, freeWhat: "일부 무료 기능(Splicer 등)", paidFrom: 7.49, paidName: "Starter", annualOnly: true, priceUrl: "https://www.artbreeder.com/pricing" },
  askup: { priceUrl: "https://pf.kakao.com/_BhxkWxj" },
  beautifulai: { domain: "beautiful.ai", visits: 835600, freeStart: false, paidFrom: 45, paidName: "Pro (monthly option)", priceUrl: "https://www.beautiful.ai/pricing" },
  bolt: { domain: "bolt.new", visits: 3700000, freeStart: true, freeWhat: "월 1M 토큰(일 300K 한도)", paidFrom: 18, paidName: "Pro", annualOnly: true, priceUrl: "https://bolt.new/pricing" },
  brisk: { domain: "briskteaching.com", visits: 871300, freeStart: true, freeWhat: "교사용 무료 플랜", priceUrl: "https://www.briskteaching.com/plans" },
  buffer: { domain: "buffer.com", visits: 4500000, freeStart: true, freeWhat: "채널 3개·채널당 예약 10개", paidFrom: 5, paidName: "Essentials", priceUrl: "https://buffer.com/pricing" },
  canva: { domain: "canva.com", visits: 946200000, freeStart: true, freeWhat: "템플릿 1.6M+·5GB·AI 20회", paidFrom: 12, paidName: "Pro", annualOnly: true, priceUrl: "https://www.canva.com/pricing/" },
  capcut: { domain: "capcut.com", visits: 48300000, freeStart: true, freeWhat: "기본 편집·무료 템플릿", paidFrom: 19.99, paidName: "Pro", priceUrl: "https://www.capcut.com/pricing" },
  captions: { domain: "captions.ai", visits: 798700, freeStart: true, freeWhat: "기본 편집·자막(AI 크레딧 없음)", paidFrom: 24.99, paidName: "Max", priceUrl: "https://www.captions.ai/pricing" },
  channeltalk: { domain: "channel.io", visits: 3600000, freeStart: true, freeWhat: "CX 2석·팀 30석 무료", paidFrom: 200, paidName: "Startup", annualOnly: true, priceUrl: "https://channel.io/en/pricing" },
  chatgpt: { domain: "chatgpt.com", visits: 5900000000, freeStart: true, freeWhat: "GPT-6 텍스트 무제한·도구 제한", paidFrom: 8, paidName: "Go", priceUrl: "https://chatgpt.com/pricing" },
  claude: { domain: "claude.ai", visits: 1000000000, freeStart: true, freeWhat: "웹·앱 채팅, 파일 생성", paidFrom: 20, paidName: "Pro", priceUrl: "https://claude.com/pricing" },
  claudecode: { freeStart: false, paidFrom: 20, paidName: "Pro", priceUrl: "https://claude.com/pricing" },
  clipchamp: { domain: "clipchamp.com", visits: 6500000, freeStart: true, freeWhat: "무제한 편집·내보내기", paidFrom: 9.99, paidName: "Microsoft 365 Personal", priceUrl: "https://www.microsoft.com/en-us/microsoft-365/buy/compare-all-microsoft-365-products" },
  clovanote: { domain: "clovanote.naver.com", visits: 1200000, freeStart: true, freeWhat: "매월 무료 사용 시간 제공", priceUrl: "https://clovanote.naver.com/" },
  codecademy: { domain: "codecademy.com", visits: 2500000, freeStart: true, freeWhat: "Basic 무료 학습", paidFrom: 29.99, paidName: "Plus", priceUrl: "https://www.codecademy.com/pricing" },
  connectedpapers: { domain: "connectedpapers.com", visits: 728100, freeStart: true, freeWhat: "월 그래프 5개", priceUrl: "https://www.connectedpapers.com/pricing" },
  consensus: { domain: "consensus.app", visits: 6100000, freeStart: true, freeWhat: "월 Pro 메시지 10회·딥리뷰 3회", paidFrom: 12, paidName: "Pro", annualOnly: true, priceUrl: "https://consensus.app/pricing/" },
  copilot: { freeStart: true, freeWhat: "Copilot Free(카드 불필요)", paidFrom: 10, paidName: "Pro", priceUrl: "https://github.com/features/copilot/plans" },
  copilot365: { domain: "copilot.cloud.microsoft", visits: 19900000, freeStart: true, paidFrom: 9.99, paidName: "Microsoft 365 Personal", priceUrl: "https://www.microsoft.com/en-us/microsoft-365/buy/compare-all-microsoft-365-products" },
  copyai: { domain: "copy.ai", visits: 404200, paidFrom: 29, paidName: "Chat", priceUrl: "https://www.copy.ai/prices" },
  cursor: { domain: "cursor.com", visits: 21500000, freeStart: true, freeWhat: "제한적 에이전트·채팅 요청", paidFrom: 8, paidName: "Plus", priceUrl: "https://cursor.com/pricing" },
  deepl: { domain: "deepl.com", visits: 96800000, freeStart: true, freeWhat: "월 5만자·파일 1개 번역", priceUrl: "https://www.deepl.com/en/pro" },
  descript: { domain: "descript.com", visits: 2900000, freeStart: true, freeWhat: "월 미디어 1시간", paidFrom: 24, paidName: "Hobbyist", priceUrl: "https://www.descript.com/pricing" },
  duolingo: { domain: "duolingo.com", visits: 58500000, freeStart: true, freeWhat: "무료 언어 학습", priceUrl: "https://www.duolingo.com/super" },
  durable: { domain: "durable.com", visits: 359600, freeStart: true, freeWhat: "웹사이트 미리보기·AI 300크레딧", paidFrom: 25, paidName: "Launch", priceUrl: "https://durable.com/pricing" },
  elevenlabs: { domain: "elevenlabs.io", visits: 33600000, freeStart: true, freeWhat: "월 10k 크레딧", paidFrom: 6, paidName: "Starter", priceUrl: "https://elevenlabs.io/pricing" },
  elicit: { domain: "elicit.com", visits: 1700000, freeStart: true, freeWhat: "논문 검색·요약 무제한", paidFrom: 49, paidName: "Pro", annualOnly: true, priceUrl: "https://elicit.com/pricing" },
  figma: { domain: "figma.com", visits: 77600000, freeStart: true, freeWhat: "드래프트 무제한·AI 크레딧", priceUrl: "https://www.figma.com/pricing/" },
  fin: { domain: "fin.ai", visits: 509200, freeStart: false, priceUrl: "https://fin.ai/pricing" },
  finalround: { domain: "finalroundai.com", visits: 384100, freeStart: true, freeWhat: "목표 설정·자료 준비", paidFrom: 25, paidName: "Pro", priceUrl: "https://www.finalroundai.com/pricing" },
  fireflies: { domain: "fireflies.ai", visits: 4300000, freeStart: true, freeWhat: "무제한 전사·AI 크레딧 20", paidFrom: 18, paidName: "Pro", priceUrl: "https://fireflies.ai/pricing" },
  firefly: { domain: "firefly.adobe.com", visits: 23000000, freeStart: true, freeWhat: "일일 무료 생성", paidFrom: 9.99, paidName: "Adobe Firefly Standard", priceUrl: "https://www.adobe.com/products/firefly/plans.html" },
  framer: { domain: "framer.com", visits: 5300000, freeStart: true, freeWhat: "CMS 10개·1,000페이지", paidFrom: 10, paidName: "Basic", priceUrl: "https://www.framer.com/pricing" },
  gamma: { domain: "gamma.app", visits: 21100000, freeStart: true, freeWhat: "시작 크레딧 400(미충전)", paidFrom: 9, paidName: "Plus", priceUrl: "https://gamma.app/pricing" },
  gemini: { domain: "gemini.google.com", visits: 2600000000, freeStart: true, freeWhat: "Google 계정으로 무료", paidFrom: 4.99, paidName: "Google AI Plus", priceUrl: "https://gemini.google/subscriptions/" },
  genspark: { domain: "genspark.ai", visits: 11100000, priceUrl: "https://www.genspark.ai/pricing" },
  gizmo: { domain: "gizmo.ai", visits: 7800000, priceUrl: "https://gizmo.ai/pricing" },
  grammarly: { domain: "grammarly.com", visits: 59800000, freeStart: true, freeWhat: "맞춤법·문법, 월 AI 100회", priceUrl: "https://www.grammarly.com/plans" },
  grok: { domain: "grok.com", visits: 205500000, freeStart: true, paidFrom: 8, paidName: "Plus", priceUrl: "https://grok.com/plans" },
  hailuo: { domain: "hailuoai.video", visits: 2300000, priceUrl: "https://hailuoai.video/subscribe" },
  heygen: { domain: "heygen.com", visits: 8700000, freeStart: true, freeWhat: "월 3개 영상(워터마크)", paidFrom: 29, paidName: "Creator", priceUrl: "https://www.heygen.com/pricing" },
  huggingface: { domain: "huggingface.co", visits: 31200000, freeStart: true, paidFrom: 9, paidName: "PRO", priceUrl: "https://huggingface.co/pricing" },
  ideogram: { domain: "ideogram.ai", visits: 2100000, freeStart: true, freeWhat: "주간 무료 크레딧(조건부)", paidFrom: 20, paidName: "Plus", priceUrl: "https://ideogram.ai/pricing" },
  ifttt: { domain: "ifttt.com", visits: 797200, freeStart: true, freeWhat: "애플릿 2개", paidFrom: 2.99, paidName: "Pro", annualOnly: true, priceUrl: "https://ifttt.com/plans" },
  jasper: { domain: "jasper.ai", visits: 421800, freeStart: false, paidFrom: 69, paidName: "Pro", priceUrl: "https://www.jasper.ai/pricing" },
  jenni: { domain: "jenni.ai", visits: 1400000, freeStart: true, freeWhat: "매일 자동완성 10회·AI채팅 5회", paidFrom: 12, paidName: "Plus", priceUrl: "https://jenni.ai/pricing" },
  julius: { domain: "julius.ai", visits: 633700, freeStart: true, freeWhat: "매일 무료 크레딧 제공", paidFrom: 20, paidName: "Plus", priceUrl: "https://julius.ai/pricing" },
  kahoot: { domain: "kahoot.com", visits: 9600000, freeStart: true, freeWhat: "Kahoot! Go, 최대 10명 참가", paidFrom: 9, paidName: "Kahoot!+ Bronze", priceUrl: "https://kahoot.com/register/pricing-personal/" },
  khanmigo: { domain: "khanmigo.ai", visits: 191400, freeStart: true, freeWhat: "교사용 무료(수업계획·루브릭 등)", paidFrom: 4, paidName: "For you", priceUrl: "https://www.khanmigo.ai/pricing" },
  khroma: { domain: "khroma.co", visits: 139900, freeStart: true, freeWhat: "AI 색상 팔레트 생성·저장 무제한", priceUrl: "https://www.khroma.co" },
  kling: { freeStart: true, domain: "kling.ai", visits: 11900000, priceUrl: "https://kling.ai/app/membership/membership-plan" },
  knowt: { domain: "knowt.com", visits: 4000000, freeStart: true, freeWhat: "파일 생성·협업·저장 무제한", paidFrom: 24.99, paidName: "Ultra", priceUrl: "https://knowt.com/plans" },
  krea: { domain: "krea.ai", visits: 4500000, freeStart: true, freeWhat: "매일 100 유닛", paidFrom: 9, paidName: "Basic", priceUrl: "https://www.krea.ai/pricing" },
  krisp: { domain: "krisp.ai", visits: 630900, freeStart: false, paidFrom: 16, paidName: "Core", priceUrl: "https://krisp.ai/pricing/" },
  lalal: { domain: "lalal.ai", visits: 2200000, freeStart: true, freeWhat: "10분 처리, 결과 미리듣기", paidFrom: 7.5, paidName: "Lite", annualOnly: true, priceUrl: "https://www.lalal.ai/pricing/" },
  lechat: { domain: "chat.mistral.ai", visits: 5300000, freeStart: true, freeWhat: "제한된 메시지·웹검색", paidFrom: 14.99, paidName: "Pro", priceUrl: "https://mistral.ai/pricing" },
  leonardo: { domain: "leonardo.ai", visits: 7100000, freeStart: true, freeWhat: "매일 150 토큰", priceUrl: "https://leonardo.ai/pricing" },
  lightroom: { annualOnly: true, domain: "lightroom.adobe.com", visits: 6200000, freeStart: true, freeWhat: "모바일 앱 무료", paidFrom: 11.99, paidName: "Lightroom", priceUrl: "https://www.adobe.com/products/photoshop-lightroom/plans.html" },
  liner: { domain: "liner.com", visits: 7200000, freeStart: true, freeWhat: "고급검색 무제한, 파일 1개/일", paidFrom: 17.99, paidName: "Pro", priceUrl: "https://liner.com/pricing" },
  lmstudio: { domain: "lmstudio.ai", visits: 2500000, freeStart: true, freeWhat: "로컬 LLM 무료 실행", paidFrom: 20, paidName: "Bionic+", priceUrl: "https://lmstudio.ai/pricing" },
  looka: { domain: "looka.com", visits: 771800, freeStart: false, priceUrl: "https://looka.com/pricing" },
  lovable: { paidName: "Pro", paidFrom: 25, domain: "lovable.dev", visits: 29900000, freeStart: true, freeWhat: "하루 5 크레딧(월 30)", priceUrl: "https://lovable.dev/pricing" },
  luma: { domain: "lumalabs.ai", visits: 2300000, freeStart: false, paidFrom: 30, paidName: "Plus", priceUrl: "https://lumalabs.ai/pricing" },
  magicschool: { domain: "magicschool.ai", visits: 2800000, freeStart: true, freeWhat: "교사 도구 80+ 무료", paidFrom: 12.99, paidName: "Plus", priceUrl: "https://www.magicschool.ai/pricing" },
  make: { domain: "make.com", visits: 5100000, freeStart: true, freeWhat: "월 1,000 크레딧", priceUrl: "https://www.make.com/en/pricing" },
  manus: { domain: "manus.im", visits: 19500000, freeStart: true, freeWhat: "매일 300 크레딧", priceUrl: "https://manus.im/pricing" },
  meshy: { domain: "meshy.ai", visits: 20000000, freeStart: true, freeWhat: "월 100 크레딧", paidFrom: 20, paidName: "Pro", priceUrl: "https://www.meshy.ai/pricing" },
  metaai: { domain: "meta.ai", visits: 34400000, freeStart: true, priceUrl: "https://www.meta.ai" },
  midjourney: { domain: "midjourney.com", visits: 8700000, freeStart: false, paidFrom: 10, paidName: "Basic", priceUrl: "https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans" },
  mindtrip: { domain: "mindtrip.ai", visits: 1700000, priceUrl: "https://mindtrip.ai/pricing" },
  mintlify: { domain: "mintlify.com", visits: 321800, freeStart: true, freeWhat: "편집자 5명, 커스텀 도메인", priceUrl: "https://www.mintlify.com/pricing" },
  miro: { domain: "miro.com", visits: 30200000, freeStart: true, freeWhat: "편집 가능 보드 3개", paidFrom: 8, paidName: "Starter", annualOnly: true, priceUrl: "https://miro.com/pricing/" },
  moises: { domain: "moises.ai", visits: 4200000, freeStart: true, freeWhat: "월 제한된 업로드", priceUrl: "https://moises.ai/pricing/" },
  mscopilot: { domain: "copilot.microsoft.com", visits: 64400000, freeStart: true, freeWhat: "제한된 무료 Copilot", paidFrom: 9.99, paidName: "Microsoft 365 Personal", priceUrl: "https://www.microsoft.com/en-us/copilot/pricing/individuals" },
  msdesigner: { domain: "designer.microsoft.com", visits: 1500000, priceUrl: "https://designer.microsoft.com" },
  myrealtrip: { domain: "myrealtrip.com", visits: 5300000, priceUrl: "https://www.myrealtrip.com" },
  n8n: { domain: "n8n.io", visits: 4900000, freeStart: true, freeWhat: "셀프호스팅 Community 무료", paidFrom: 20, paidName: "Starter", annualOnly: true, priceUrl: "https://n8n.io/pricing/" },
  napkin: { domain: "napkin.ai", visits: 1200000, freeStart: true, freeWhat: "주 500 AI 크레딧", paidFrom: 12, paidName: "Plus", priceUrl: "https://www.napkin.ai/pricing" },
  notebooklm: { domain: "notebook.google.com", visits: 204200000, freeStart: true, priceUrl: "https://notebook.google.com" },
  notion: { domain: "notion.com", visits: 173400000, freeStart: true, freeWhat: "개인용, Notion AI 체험", priceUrl: "https://www.notion.com/pricing" },
  ollama: { domain: "ollama.com", visits: 9000000, freeStart: true, freeWhat: "로컬 실행 + 스타터 크레딧", paidFrom: 20, paidName: "Pro", priceUrl: "https://ollama.com/pricing" },
  opusclip: { domain: "opus.pro", visits: 5100000, freeStart: true, freeWhat: "월 60 크레딧(워터마크)", paidFrom: 15, paidName: "Starter", priceUrl: "https://www.opus.pro/pricing" },
  otter: { domain: "otter.ai", visits: 6700000, freeStart: true, freeWhat: "월 300분 전사", paidFrom: 16.99, paidName: "Pro", priceUrl: "https://otter.ai/pricing" },
  papago: { domain: "papago.naver.com", visits: 16300000, freeStart: true, priceUrl: "https://papago.naver.com" },
  perplexity: { domain: "perplexity.ai", visits: 91700000, freeStart: true, freeWhat: "기본 검색·출처 표기", paidFrom: 17, paidName: "Pro", annualOnly: true, priceUrl: "https://www.perplexity.ai/hub/pricing" },
  photomath: { domain: "photomath.com", visits: 272100, freeStart: true, freeWhat: "단계별 풀이", paidFrom: 9.99, paidName: "Plus (Monthly)", priceUrl: "https://photomath.com" },
  photoshop: { annualOnly: true, domain: "photoshop.adobe.com", visits: 2500000, freeStart: false, paidFrom: 19.99, paidName: "Photography", priceUrl: "https://www.adobe.com/products/photoshop/plans.html" },
  picsart: { domain: "picsart.com", visits: 15900000, paidFrom: 10.5, paidName: "Pro", annualOnly: true, priceUrl: "https://picsart.com/pricing" },
  pika: { domain: "pika.art", visits: 1400000, freeStart: false, paidFrom: 10, paidName: "Starter", priceUrl: "https://pika.art/pricing" },
  pitch: { domain: "pitch.com", visits: 1200000, freeStart: true, freeWhat: "AI 크레딧 100, 프레젠테이션 무제한", priceUrl: "https://pitch.com/pricing" },
  playground: { domain: "playgroundai.com", visits: 570800, freeStart: true, freeWhat: "3시간마다 10장 생성", paidFrom: 15, paidName: "Pro", priceUrl: "https://playgroundai.com/pricing" },
  powerautomate: { domain: "powerautomate.com", visits: 6500000, freeStart: false, paidFrom: 15, paidName: "Power Automate Premium", annualOnly: true, priceUrl: "https://www.microsoft.com/en-us/power-platform/products/power-automate/pricing" },
  powerbi: { domain: "powerbi.com", visits: 56900000, freeStart: true, freeWhat: "Fabric 무료 계정(공유 불가)", paidFrom: 14, paidName: "Power BI Pro", annualOnly: true, priceUrl: "https://www.microsoft.com/en-us/power-platform/products/power-bi/pricing" },
  predis: { domain: "predis.ai", visits: 220900, freeStart: false, paidFrom: 19, paidName: "Core", annualOnly: true, priceUrl: "https://predis.ai/pricing/" },
  premiere: { annualOnly: true, freeStart: false, paidFrom: 22.99, paidName: "Premiere", priceUrl: "https://www.adobe.com/products/premiere/plans.html" },
  prezi: { domain: "prezi.com", visits: 7300000, freeStart: true, paidFrom: 7, paidName: "Standard", annualOnly: true, priceUrl: "https://prezi.com/pricing/" },
  qanda: { domain: "qanda.ai", visits: 120100 },
  qodo: { domain: "qodo.ai", visits: 168900, freeStart: false, priceUrl: "https://www.qodo.ai/pricing/" },
  quillbot: { domain: "quillbot.com", visits: 35800000, freeStart: true, freeWhat: "패러프레이즈 100단어·기본 문법", paidFrom: 8.33, paidName: "Premium", annualOnly: true, priceUrl: "https://quillbot.com/premium" },
  quizlet: { domain: "quizlet.com", visits: 71900000, priceUrl: "https://quizlet.com/upgrade" },
  recraft: { domain: "recraft.ai", visits: 1500000, freeStart: true, priceUrl: "https://www.recraft.ai/pricing" },
  relume: { domain: "relume.ai", visits: 437200, freeStart: true, freeWhat: "무료 플랜·웹사이트 1개 분량 AI", paidFrom: 14, paidName: "Pro", priceUrl: "https://www.relume.ai/pricing" },
  removebg: { domain: "remove.bg", visits: 54200000, freeStart: true, freeWhat: "무료 기본 기능·체험 크레딧 1개", paidFrom: 9, paidName: "Subscription Plan", priceUrl: "https://www.remove.bg/pricing" },
  replit: { domain: "replit.com", visits: 10900000, paidFrom: 20, paidName: "Core", priceUrl: "https://replit.com/pricing" },
  researchrabbit: { domain: "researchrabbit.ai", visits: 806400, freeStart: true, freeWhat: "무제한 검색·컬렉션", paidFrom: 12.5, paidName: "ResearchRabbit+", priceUrl: "https://www.researchrabbit.ai/pricing" },
  rezi: { domain: "rezi.ai", visits: 708700, freeStart: true, freeWhat: "이력서 1개·PDF 3회 다운로드", paidFrom: 29, paidName: "Pro", priceUrl: "https://www.rezi.ai/pricing" },
  riverside: { domain: "riverside.com", visits: 3900000, freeStart: true, paidFrom: 35, paidName: "Pro", priceUrl: "https://riverside.com/pricing" },
  rosebud: { domain: "rosebud.ai", visits: 612300, freeStart: true, freeWhat: "8,000 크레딧(주간 충전)", paidFrom: 15, paidName: "Indie Dev", priceUrl: "https://rosebud.ai/pricing" },
  runway: { domain: "runway.com", visits: 5000000, freeStart: true, freeWhat: "125 크레딧 1회 제공", paidFrom: 15, paidName: "Standard", priceUrl: "https://runwayml.com/pricing" },
  scenario: { domain: "scenario.com", visits: 345000, freeStart: true, freeWhat: "일 50 무료 크레딧", paidFrom: 15, paidName: "Starter", priceUrl: "https://www.scenario.com/pricing" },
  scispace: { domain: "scispace.com", visits: 4100000, paidFrom: 20, paidName: "Premium", priceUrl: "https://scispace.com/pricing" },
  scite: { domain: "scite.ai", visits: 833000, freeStart: false, paidFrom: 12, paidName: "Basic", annualOnly: true, priceUrl: "https://scite.ai/pricing" },
  semanticscholar: { domain: "semanticscholar.org", visits: 7700000, freeStart: true, freeWhat: "전체 무료 연구 검색 도구", priceUrl: "https://www.semanticscholar.org/about" },
  soundraw: { domain: "soundraw.io", visits: 223300, paidFrom: 16.99, paidName: "Creator", priceUrl: "https://soundraw.io/pricing" },
  speak: { domain: "speak.com", visits: 622000, freeStart: false, priceUrl: "https://www.speak.com/" },
  spline: { domain: "spline.design", visits: 626400, freeStart: true, freeWhat: "개인 파일 제한·워터마크 웹보내기", paidFrom: 15, paidName: "Hobby", priceUrl: "https://spline.design/pricing" },
  stableaudio: { domain: "stableaudio.com", visits: 126700, freeStart: true, freeWhat: "월 50 크레딧·상업 라이선스", paidFrom: 12, paidName: "Solo", priceUrl: "https://stableaudio.com/pricing" },
  stitch: { domain: "stitch.withgoogle.com", visits: 5500000, priceUrl: "https://stitch.withgoogle.com/" },
  submagic: { domain: "submagic.co", visits: 714100, paidFrom: 19, paidName: "Starter", priceUrl: "https://www.submagic.co/pricing" },
  sudowrite: { domain: "sudowrite.com", visits: 1100000, freeStart: false, paidFrom: 10, paidName: "Hobby & Student", priceUrl: "https://www.sudowrite.com/pricing" },
  suno: { domain: "suno.com", visits: 75500000, freeStart: true, freeWhat: "일 50 크레딧·상업권 없음", paidFrom: 8, paidName: "Pro", priceUrl: "https://suno.com/pricing" },
  supabase: { domain: "supabase.com", visits: 28400000, freeStart: true, paidFrom: 25, paidName: "Pro", priceUrl: "https://supabase.com/pricing" },
  synthesia: { domain: "synthesia.io", visits: 1700000, freeStart: true, freeWhat: "월 10분 영상·워터마크", paidFrom: 19, paidName: "Starter", priceUrl: "https://www.synthesia.io/pricing" },
  tableau: { domain: "tableau.com", visits: 6700000, freeStart: true, freeWhat: "Desktop 무료판 로컬 분석", paidFrom: 15, paidName: "Tableau Standard", annualOnly: true, priceUrl: "https://www.tableau.com/pricing/individual" },
  teal: { domain: "tealhq.com", visits: 1600000, freeStart: true, freeWhat: "무제한 이력서·지원 추적", paidFrom: 29, paidName: "Teal+", priceUrl: "https://www.tealhq.com/pricing" },
  topaz: { domain: "topazlabs.com", visits: 2500000, freeStart: false, paidFrom: 39, paidName: "Topaz Photo Personal", priceUrl: "https://www.topazlabs.com/topaz-photo" },
  tripo: { domain: "tripo3d.ai", visits: 14600000, freeStart: true, freeWhat: "월 200 크레딧(약 13모델)", paidFrom: 20, paidName: "Pro", priceUrl: "https://www.tripo3d.ai/pricing" },
  tubebuddy: { domain: "tubebuddy.com", visits: 537900, freeStart: true, paidFrom: 12, paidName: "Pro", annualOnly: true, priceUrl: "https://www.tubebuddy.com/pricing" },
  typecast: { domain: "typecast.ai", visits: 1300000, freeStart: true, freeWhat: "무제한 생성·평생 3,000 크레딧", paidFrom: 5, paidName: "Basic", priceUrl: "https://typecast.ai/pricing" },
  udio: { domain: "udio.com", visits: 1100000, freeStart: true, freeWhat: "일 10·월 100 크레딧", paidFrom: 10, paidName: "Standard", priceUrl: "https://www.udio.com/pricing" },
  uizard: { domain: "uizard.io", visits: 346500, freeStart: true, freeWhat: "월 3회 AI 생성·프로젝트 2개", paidFrom: 12, paidName: "Pro", annualOnly: true, priceUrl: "https://uizard.io/pricing/" },
  unityai: { freeStart: false, priceUrl: "https://unity.com/products/compare-plans" },
  uxpilot: { domain: "uxpilot.ai", visits: 523000, freeStart: true, paidFrom: 12, paidName: "Standard", annualOnly: true, priceUrl: "https://uxpilot.ai/pricing" },
  v0: { domain: "v0.app", visits: 3200000, freeStart: true, freeWhat: "하루 7메시지·배포", paidFrom: 30, paidName: "Plus", priceUrl: "https://v0.app/pricing" },
  veo: { paidFrom: 4.99, paidName: "Google AI Plus", priceUrl: "https://gemini.google/subscriptions/" },
  vidiq: { domain: "vidiq.com", visits: 6900000, freeStart: true, freeWhat: "월 150 AI 크레딧", paidFrom: 19, paidName: "Boost", priceUrl: "https://vidiq.com/pricing/" },
  vizard: { domain: "vizard.ai", visits: 1500000, freeStart: true, freeWhat: "월 60 크레딧", paidFrom: 29, paidName: "Creator", priceUrl: "https://vizard.ai/pricing" },
  vrew: { domain: "vrew.ai", visits: 615900, freeStart: true, priceUrl: "https://vrew.ai/en/pricing/" },
  wanderlog: { domain: "wanderlog.com", visits: 7200000, freeStart: true, freeWhat: "무제한 장소·실시간 공동편집", paidFrom: 3.33, paidName: "Pro Annual", annualOnly: true, priceUrl: "https://wanderlog.com/pro" },
  whimsical: { domain: "whimsical.com", visits: 1200000, freeStart: true, freeWhat: "월 보드 50개·문서 50블록", paidFrom: 10, paidName: "Pro", priceUrl: "https://whimsical.com/pricing" },
  wolfram: { domain: "wolframalpha.com", visits: 2900000, freeStart: true, freeWhat: "로그인 시 Basic 무료", paidFrom: 9.99, paidName: "Pro", priceUrl: "https://www.wolframalpha.com/pro/pricing" },
  wordtune: { domain: "wordtune.com", visits: 391400, freeStart: true, freeWhat: "일 10회 리라이트", paidFrom: 6.99, paidName: "Advanced", priceUrl: "https://www.wordtune.com/plans" },
  wrtn: { domain: "wrtn.ai", visits: 5300000, priceUrl: "https://wrtn.ai/" },
  zapier: { domain: "zapier.com", visits: 5000000, freeStart: true, freeWhat: "월 100 태스크", paidFrom: 29.99, paidName: "Professional", priceUrl: "https://zapier.com/pricing" },
  zendesk: { domain: "zendesk.com", visits: 62100000, freeStart: false, paidFrom: 19, paidName: "Support Team", annualOnly: true, priceUrl: "https://www.zendesk.com/pricing/" },
};

export const TOOL_SKILL: Partial<Record<ToolKey, Partial<Record<Board, SkillScore>>>> = {
  chatgpt: { text: { entry: "GPT-6.1 Sol", score: 1480, rank: 27 }, webdev: { entry: "GPT-6 Astra", score: 1775, rank: 2 }, image: { entry: "GPT-Image-2.5 Sunburst", score: 1425, rank: 1 }, imageEdit: { entry: "GPT-Image-2.5 Sunburst", score: 1514, rank: 1 }, search: { entry: "GPT-5.6 Sol (Search)", score: 1261, rank: 1 } },
  claude: { text: { entry: "Claude Opus 5.5", score: 1509, rank: 2 }, webdev: { entry: "Claude Opus 5.5", score: 1807, rank: 1 }, search: { entry: "Claude Opus 4.6 (Search)", score: 1251, rank: 3 } },
  claudecode: { webdev: { entry: "Claude Opus 5.5", score: 1807, rank: 1 } },
  gemini: { text: { entry: "Gemini 4 Argon", score: 1517, rank: 1 }, webdev: { entry: "Gemini 4 Argon", score: 1673, rank: 11 }, image: { entry: "Nano Banana 2.1", score: 1328, rank: 6 }, imageEdit: { entry: "Nano Banana 2.1", score: 1426, rank: 5 }, search: { entry: "Gemini 3.1 Pro (Grounding)", score: 1209, rank: 15 } },
  aistudio: { text: { entry: "Gemini 4 Argon", score: 1517, rank: 1 }, webdev: { entry: "Gemini 4 Argon", score: 1673, rank: 11 } },
  grok: { text: { entry: "Grok 4.7", score: 1441, rank: 96 }, webdev: { entry: "Grok 4.7", score: 1637, rank: 18 }, image: { entry: "Grok Imagine Image 2.0", score: 1334, rank: 4 }, imageEdit: { entry: "Grok Imagine Image 2.0", score: 1439, rank: 4 }, video: { entry: "Grok Imagine Video 1.5", score: 1492, rank: 4 }, search: { entry: "Grok 4.5 (Search)", score: 1216, rank: 13 } },
  metaai: { text: { entry: "Muse Spark 1.3", score: 1496, rank: 10 } },
  lechat: { text: { entry: "Mistral Medium 3.5", score: 1426, rank: 119 } },
  perplexity: { search: { entry: "Sonar Reasoning Pro (High)", score: 1139, rank: 37 } },
  ideogram: { image: { entry: "Ideogram 4.0 (Quality)", score: 1205, rank: 20 }, imageEdit: { entry: "Ideogram 4.5", score: 1347, rank: 21 } },
  recraft: { image: { entry: "Recraft V4.1 Utility Pro", score: 1169, rank: 26 } },
  krea: { image: { entry: "Krea 2 Medium", score: 1124, rank: 45 }, imageEdit: { entry: "Krea 3 Ultra", score: 1411, rank: 8 } },
  leonardo: { image: { entry: "Lucid Origin", score: 1013, rank: 75 } },
  msdesigner: { image: { entry: "DALL-E 3", score: 968, rank: 79 } },
  veo: { video: { entry: "Veo 3.1 (Audio)", score: 1364, rank: 12 } },
  hailuo: { video: { entry: "Hailuo 2.3", score: 1206, rank: 32 } },
  runway: { video: { entry: "Runway Gen-4.5", score: 1225, rank: 27 } },
  kling: { video: { entry: "Kling 2.5 Turbo (1080p)", score: 1220, rank: 28 } },
  luma: { video: { entry: "Luma Ray3", score: 1206, rank: 31 } },
  pika: { video: { entry: "Pika 2.2", score: 1009, rank: 47 } },
  suno: { music: { entry: "Suno v6", score: 1148, rank: 1 } },
  stableaudio: { music: { entry: "Stable Audio 3 Large", score: 1014, rank: 8 } },
  elevenlabs: { tts: { entry: "Eleven v4 Turbo", score: 1335, rank: 1 } },
};

/** 분야 태그 → 그 일을 재는 측정 (태그가 여러 개면 분야 안에서 가장 많은 것) */
export const TAG_BOARD: Record<string, Board> = {
  "대화형 AI": "text",
  글쓰기: "text",
  번역: "text",
  교정: "text",
  튜터: "text",
  문서: "text",
  카피: "text",
  자기소개서: "text",
  상담: "text",
  "코드 생성": "webdev",
  에디터: "webdev",
  "UI 생성": "webdev",
  프로토타입: "webdev",
  "이미지 생성": "image",
  그래픽: "image",
  "디자인 시안": "image",
  "영상 생성": "video",
  음악: "music",
  음성: "tts",
  검색: "search",
  조사: "search",
};

/** 분야별로 직접 정한 측정 (태그만으로 정해지지 않을 때). null = 이 분야 일을 재는 측정이 없음 */
export const FIELD_BOARD: Record<string, Board | null> = {
  "office/sheet": "text",
  "presentation/rehearsal": "text",
  "language/speaking": "text",
  "data/analyze": "text",
  "support/reply": "text",
  "codingstart/ask": "text",
  // 발표자(아바타) 영상은 영상 생성 측정과 다른 일이라 비교하지 않아요
  "video/avatar": null,
};
