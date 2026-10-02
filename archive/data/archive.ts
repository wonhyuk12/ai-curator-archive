/**
 * AI ARCHIVE — single source of truth.
 *
 * 구조: Category → SubField → ToolEntry
 *   - TOOLS: 툴 기본 정보 카탈로그 (이름, 설명, 가격, 링크, 관련 툴). 한 번만 정의.
 *   - ARCHIVE: 직업별 트리. 각 leaf 는 TOOLS 의 키를 참조하고,
 *     그 맥락에서의 용도(useCase), 태그(tag), 추천 문구(recommendation)를 가진다.
 *
 * 툴 추가 방법:
 *   1) TOOLS 에 새 키를 추가 (이미 있으면 생략)
 *   2) 원하는 SubField 의 tools 배열에 { tool: "키", useCase, tag, recommendation } 추가
 */
import type { LucideIcon } from "lucide-react";
import {
  Box,
  Brain,
  BrainCircuit,
  Captions,
  Clapperboard,
  CodeXml,
  GraduationCap,
  Languages,
  LayoutTemplate,
  MessagesSquare,
  Music,
  NotebookPen,
  Palette,
  PenTool,
  Rocket,
  ScanSearch,
  Scissors,
  Server,
  Shapes,
  Smartphone,
  Sparkles,
  WandSparkles,
} from "lucide-react";

export type Pricing = "Free" | "Freemium" | "Paid";

export interface ToolInfo {
  name: string;
  description: string;
  pricing: Pricing;
  url: string;
  /** TOOLS 키 목록 */
  related: ToolKey[];
  /** 왜 좋은가 */
  strengths: string[];
  /** 이렇게 활용하세요 (단계) */
  howTo: string[];
}

export interface ToolEntry {
  tool: ToolKey;
  /** 한 줄 용도 — 노드 카드에 표시 */
  useCase: string;
  tag: string;
  /** "이 작업엔 이걸 써라" */
  recommendation: string;
  /** 이 작업에 바로 쓸 수 있는 예시 프롬프트 (프롬프트 입력이 없는 툴은 생략) */
  prompt?: string;
}

export interface SubField {
  id: string;
  name: string;
  nameEn: string;
  icon: LucideIcon;
  tools: ToolEntry[];
}

export interface Category {
  slug: string;
  index: string;
  name: string;
  nameEn: string;
  accent: string;
  icon: LucideIcon;
  tagline: string;
  fields: SubField[];
}

/* ────────────────────────────────────────────────────────────
 * TOOL CATALOG
 * ──────────────────────────────────────────────────────────── */

const defineTools = <T extends Record<string, Omit<ToolInfo, "related"> & { related: string[] }>>(t: T) => t;

const TOOL_TABLE = defineTools({
  figma: {
    name: "Figma",
    description: "협업 기반 UI/UX 디자인 툴. Figma AI 로 레이어 정리, 목업 자동 생성, 프로토타입 연결까지 지원한다.",
    pricing: "Freemium",
    url: "https://www.figma.com",
    related: ["v0", "framer", "stitch"],
    strengths: ["디자인·프로토타입·개발 핸드오프를 한 파일에서 끝낸다", "실시간 협업 — 개발자·기획자가 같은 화면을 보며 코멘트", "Figma AI 로 레이어 이름 정리, 목업 생성 같은 반복 작업을 자동화"],
    howTo: ["프레임을 만들고 오토 레이아웃으로 반응형 구조를 잡는다", "반복되는 요소는 컴포넌트·변수로 만들어 디자인 시스템화한다", "Dev Mode 링크를 개발자에게 공유해 스펙·CSS 를 바로 확인하게 한다"],
  },
  gemini: {
    name: "Gemini",
    description: "Google 의 멀티모달 AI. 현재 Gemini 3.8 Flash · 3.1 Pro. 텍스트·이미지·코드를 한 번에 다루며 이미지 생성과 긴 문서 분석에 강하다.",
    pricing: "Freemium",
    url: "https://gemini.google.com",
    related: ["chatgpt", "claude", "notebooklm"],
    strengths: ["텍스트·이미지·영상·PDF 를 한 번에 이해하는 멀티모달", "매우 긴 컨텍스트로 대용량 문서도 통째로 분석", "Gmail·Docs·Drive 등 Google 서비스와 연동"],
    howTo: ["분석할 파일(이미지·PDF·영상)을 먼저 첨부한다", "원하는 결과 형식(표, 목록, 시안 개수)을 구체적으로 지정한다", "마음에 드는 결과를 기준으로 '이 방향으로 더' 식으로 반복 수정한다"],
  },
  v0: {
    name: "v0",
    description: "Vercel 의 생성형 UI 툴. 프롬프트나 스크린샷으로 React + Tailwind 컴포넌트를 바로 만들어준다.",
    pricing: "Freemium",
    url: "https://v0.app",
    related: ["bolt", "cursor", "vercel"],
    strengths: ["프롬프트·스크린샷만으로 실제 동작하는 React 코드 생성", "shadcn/ui + Tailwind 기반이라 코드가 깔끔하고 재사용하기 쉽다", "만든 결과를 바로 배포하거나 내 프로젝트로 가져올 수 있다"],
    howTo: ["만들 화면의 구성 요소·상태·스타일을 목록으로 설명한다", "미리보기에서 어색한 부분을 채팅으로 콕 집어 수정 요청한다", "완성되면 코드를 복사하거나 CLI 로 내 프로젝트에 추가한다"],
  },
  claude: {
    name: "Claude",
    description: "Anthropic 의 AI 어시스턴트. 현재 Claude Fable 5.1 · Opus 5.5 · Sonnet 5.5. 긴 컨텍스트, 정교한 코드 작성, 문서 분석과 글쓰기에 강하다.",
    pricing: "Freemium",
    url: "https://claude.ai",
    related: ["claudecode", "chatgpt", "cursor"],
    strengths: ["긴 문서·코드도 한 번에 읽는 넓은 컨텍스트", "지시를 꼼꼼히 따르고 구조적인 코드·글을 쓴다", "스크린샷을 보고 코드나 분석 결과로 변환"],
    howTo: ["역할·목표·제약 조건을 목록으로 명확히 적는다", "관련 파일·스크린샷·예시를 함께 첨부한다", "결과를 받으면 '이 부분은 이렇게' 식으로 구체적으로 피드백한다"],
  },
  cursor: {
    name: "Cursor",
    description: "AI 네이티브 코드 에디터. 코드베이스 전체를 이해하고 다중 파일 편집과 에이전트 모드를 제공한다.",
    pricing: "Freemium",
    url: "https://cursor.com",
    related: ["claudecode", "copilot", "claude"],
    strengths: ["코드베이스 전체를 인덱싱해 맥락을 이해한 답변", "Tab 자동완성이 다음 편집 위치까지 예측", "에이전트 모드로 여러 파일을 한 번에 수정·실행"],
    howTo: ["@파일, @폴더로 관련 코드를 컨텍스트에 명시한다", "작은 수정은 Cmd/Ctrl+K, 큰 작업은 에이전트 채팅으로 요청한다", "변경 diff 를 검토한 뒤 파일 단위로 수락/거절한다"],
  },
  bolt: {
    name: "Bolt.new",
    description: "브라우저에서 풀스택 앱을 프롬프트로 생성·실행·배포하는 AI 개발 환경.",
    pricing: "Freemium",
    url: "https://bolt.new",
    related: ["v0", "netlify", "cursor"],
    strengths: ["설치 없이 브라우저에서 풀스택 앱을 생성·실행", "프론트·백엔드·DB 연결까지 한 번에 구성", "클릭 한 번으로 배포해 링크 공유"],
    howTo: ["기능 목록과 기술 스택을 첫 프롬프트에 명시한다", "한 번에 다 만들기보다 기능 단위로 나눠 추가 요청한다", "에러가 나면 에러 메시지를 그대로 붙여 수정 요청한다"],
  },
  claudecode: {
    name: "Claude Code",
    description: "터미널에서 동작하는 에이전트형 코딩 툴. 저장소를 탐색하고, 코드를 수정하고, 테스트와 커밋까지 수행한다.",
    pricing: "Paid",
    url: "https://claude.com/product/claude-code",
    related: ["claude", "cursor", "copilot"],
    strengths: ["터미널에서 저장소를 직접 탐색·수정·테스트까지 수행", "여러 파일에 걸친 리팩터링·기능 추가에 강하다", "git·테스트·빌드 도구를 그대로 써서 실제 워크플로와 맞물린다"],
    howTo: ["프로젝트 폴더에서 claude 를 실행하고 작업 목표를 설명한다", "큰 작업은 '먼저 계획만 보여줘'로 방향을 확인한다", "CLAUDE.md 에 팀 규칙·명령어를 적어 두면 매번 반영된다"],
  },
  copilot: {
    name: "GitHub Copilot",
    description: "GitHub 의 AI 페어 프로그래머. 에디터 내 자동완성, 채팅, PR 리뷰와 코딩 에이전트를 제공한다.",
    pricing: "Freemium",
    url: "https://github.com/features/copilot",
    related: ["cursor", "claudecode"],
    strengths: ["VS Code·JetBrains 등 대부분의 에디터에서 동작", "GitHub 과 통합돼 PR 요약·코드 리뷰까지 지원", "이슈를 맡기면 코딩 에이전트가 PR 을 만들어 준다"],
    howTo: ["함수 이름과 주석으로 의도를 먼저 적으면 자동완성 품질이 올라간다", "Copilot Chat 에서 /tests, /fix, /explain 같은 명령을 활용한다", "PR 에서 Copilot 리뷰를 요청해 놓친 버그를 점검한다"],
  },
  supabase: {
    name: "Supabase AI",
    description: "Supabase 대시보드의 AI 어시스턴트. 자연어로 SQL, 스키마, RLS 정책, Edge Function 을 작성한다.",
    pricing: "Freemium",
    url: "https://supabase.com",
    related: ["railway", "vercel", "claudecode"],
    strengths: ["Postgres 기반 — 자연어로 SQL·스키마를 바로 생성", "RLS 보안 정책을 설명만으로 작성", "인증·스토리지·Edge Function 까지 한 플랫폼"],
    howTo: ["대시보드의 AI 어시스턴트를 열고 테이블 구조를 설명한다", "생성된 SQL 을 검토한 뒤 SQL Editor 에서 실행한다", "RLS 정책은 역할별 권한을 문장으로 정리해 요청한다"],
  },
  chatgpt: {
    name: "ChatGPT",
    description: "OpenAI 의 범용 AI 어시스턴트. 현재 GPT-6 세대(Astra · Sol · Luna)로 대화, 코드, 이미지 생성, 음성, 에이전트 기능까지 올인원.",
    pricing: "Freemium",
    url: "https://chatgpt.com",
    related: ["claude", "gemini", "perplexity"],
    strengths: ["대화·검색·이미지 생성·음성·파일 분석을 한 곳에서", "GPTs·프로젝트로 자주 하는 작업을 맞춤 설정", "사용자층이 넓어 팁·템플릿이 풍부"],
    howTo: ["내 상황(역할, 수준, 목표)을 먼저 알려준다", "결과 형식(표, 단계, 코드)을 지정한다", "프로젝트 기능으로 관련 대화·파일을 묶어 관리한다"],
  },
  perplexity: {
    name: "Perplexity",
    description: "출처를 달아주는 AI 검색 엔진. 실시간 웹 검색 기반으로 빠르고 검증 가능한 답을 준다.",
    pricing: "Freemium",
    url: "https://www.perplexity.ai",
    related: ["chatgpt", "elicit", "consensus"],
    strengths: ["모든 답변에 출처 링크가 달려 검증이 쉽다", "실시간 웹 검색으로 최신 정보에 강하다", "후속 질문으로 리서치를 깊게 이어갈 수 있다"],
    howTo: ["질문에 기간·범위(예: 최근 1년, 공식 문서)를 넣는다", "중요한 내용은 출처 링크를 직접 열어 확인한다", "Spaces 로 주제별 리서치를 모아 관리한다"],
  },
  vercel: {
    name: "Vercel",
    description: "프론트엔드 클라우드. Git 푸시만으로 프리뷰·프로덕션 배포, AI SDK 와 v0 생태계를 제공한다.",
    pricing: "Freemium",
    url: "https://vercel.com",
    related: ["netlify", "v0", "railway"],
    strengths: ["Git 푸시만 하면 자동 배포, PR 마다 프리뷰 URL", "Next.js 를 만든 회사라 최적화·신기능 지원이 가장 빠르다", "전 세계 엣지 네트워크로 빠른 로딩"],
    howTo: ["GitHub 저장소를 Vercel 에 Import 한다", "환경 변수를 프로젝트 설정에 등록한다", "PR 프리뷰 링크로 리뷰 후 main 에 머지하면 프로덕션에 반영된다"],
  },
  netlify: {
    name: "Netlify",
    description: "정적 사이트와 JAMstack 배포 플랫폼. 폼, 함수, 프리뷰 배포가 기본 내장.",
    pricing: "Freemium",
    url: "https://www.netlify.com",
    related: ["vercel", "bolt"],
    strengths: ["정적 사이트를 드래그 앤 드롭만으로 배포", "폼 처리·서버리스 함수가 기본 내장", "브랜치별 프리뷰 배포 지원"],
    howTo: ["저장소를 연결하거나 빌드 폴더를 드래그해 업로드한다", "빌드 명령과 출력 폴더를 설정한다", "커스텀 도메인을 연결하면 HTTPS 가 자동 적용된다"],
  },
  railway: {
    name: "Railway",
    description: "서버·DB·워커를 클릭 몇 번으로 띄우는 인프라 플랫폼. 백엔드 배포에 최적.",
    pricing: "Freemium",
    url: "https://railway.com",
    related: ["vercel", "supabase"],
    strengths: ["서버·DB·Redis 를 한 프로젝트 캔버스에서 관리", "Dockerfile 없이도 코드만으로 자동 빌드", "사용량 기반 과금이라 작은 프로젝트에 부담이 적다"],
    howTo: ["GitHub 저장소를 연결해 서비스를 만든다", "Postgres 등 DB 를 추가하면 연결 변수가 자동 주입된다", "로그·메트릭을 보며 리소스를 조정한다"],
  },
  framer: {
    name: "Framer",
    description: "노코드 웹사이트 빌더. AI 로 페이지 레이아웃을 생성하고 인터랙션까지 바로 퍼블리시한다.",
    pricing: "Freemium",
    url: "https://www.framer.com",
    related: ["figma", "relume", "spline"],
    strengths: ["디자인한 그대로 실제 웹사이트로 퍼블리시", "AI 로 페이지 초안을 생성하고 바로 편집", "CMS·애니메이션·SEO 까지 노코드로 해결"],
    howTo: ["AI 에 사이트 목적·톤·섹션을 설명해 초안을 만든다", "텍스트·이미지를 교체하고 인터랙션을 추가한다", "도메인을 연결하고 퍼블리시한다"],
  },
  uizard: {
    name: "Uizard",
    description: "손그림·스크린샷을 편집 가능한 UI 목업으로 변환하는 AI 디자인 툴.",
    pricing: "Freemium",
    url: "https://uizard.io",
    related: ["figma", "stitch"],
    strengths: ["손그림 스케치·스크린샷을 편집 가능한 UI 로 변환", "텍스트 설명만으로 여러 화면의 앱 목업 생성", "디자인 경험이 없어도 쉽게 사용"],
    howTo: ["앱 종류와 필요한 화면을 텍스트로 설명한다", "또는 종이 스케치를 촬영해 업로드한다", "생성된 화면을 테마·컴포넌트 단위로 다듬는다"],
  },
  midjourney: {
    name: "Midjourney",
    description: "압도적인 미감의 이미지 생성 AI. 현재 기본 버전은 V8.2 (2K 고해상도, 개선된 글자 표현). 무드보드, 키비주얼, 컨셉 아트 제작에 최강.",
    pricing: "Paid",
    url: "https://www.midjourney.com",
    related: ["firefly", "ideogram", "recraft"],
    strengths: ["최고 수준의 미적 퀄리티와 스타일 표현력", "스타일 레퍼런스로 일관된 톤의 이미지 시리즈 제작", "업스케일·변형·부분 수정 등 후작업 도구"],
    howTo: ["주제 → 스타일 → 조명 → 구도 순서로 영어 프롬프트를 쓴다", "--ar 로 비율을 지정한다 (예: 4:5, 16:9)", "마음에 드는 결과를 Vary·스타일 레퍼런스로 발전시킨다"],
  },
  firefly: {
    name: "Adobe Firefly",
    description: "상업적으로 안전한 Adobe 의 생성형 AI. 포토샵·일러스트레이터와 긴밀하게 연동된다.",
    pricing: "Freemium",
    url: "https://firefly.adobe.com",
    related: ["midjourney", "premiere"],
    strengths: ["라이선스 걱정이 적은 상업용 학습 데이터 기반", "포토샵 생성형 채우기 등 Adobe 앱과 바로 연동", "한국어 프롬프트 지원"],
    howTo: ["원하는 장면을 구체적으로 설명한다", "스타일·조명·구도 옵션으로 미세 조정한다", "포토샵으로 보내 합성·보정을 마무리한다"],
  },
  ideogram: {
    name: "Ideogram",
    description: "이미지 속 타이포그래피 표현이 정확한 이미지 생성 AI. 포스터·로고 시안에 강하다.",
    pricing: "Freemium",
    url: "https://ideogram.ai",
    related: ["midjourney", "recraft"],
    strengths: ["이미지 안의 글자를 정확하게 렌더링", "포스터·로고·썸네일 같은 타이포 중심 디자인에 강하다", "Magic Prompt 가 짧은 프롬프트를 자동으로 풍부하게 만든다"],
    howTo: ["넣을 문구를 따옴표로 감싸 명시한다", "디자인 스타일(레트로, 스위스 등)과 색상을 지정한다", "여러 결과 중 고르고 Remix 로 변형한다"],
  },
  looka: {
    name: "Looka",
    description: "브랜드 이름만 넣으면 로고와 브랜드 키트(명함, SNS 에셋)를 자동 생성한다.",
    pricing: "Paid",
    url: "https://looka.com",
    related: ["recraft", "canva"],
    strengths: ["브랜드명·업종만으로 수십 개의 로고 시안", "명함·SNS 커버 등 브랜드 키트 자동 생성", "디자이너 없이도 일관된 브랜드 적용"],
    howTo: ["브랜드명·업종·선호 스타일을 입력한다", "마음에 드는 시안을 골라 색·폰트·배치를 조정한다", "브랜드 키트를 받아 모든 채널에 적용한다"],
  },
  recraft: {
    name: "Recraft",
    description: "벡터(SVG) 출력이 가능한 디자이너용 이미지 생성 AI. 아이콘·일러스트 세트 제작에 적합.",
    pricing: "Freemium",
    url: "https://www.recraft.ai",
    related: ["ideogram", "looka", "midjourney"],
    strengths: ["SVG 벡터로 출력돼 무한 확대·편집 가능", "스타일을 고정해 일관된 아이콘·일러스트 세트 제작", "브랜드 컬러 팔레트 적용"],
    howTo: ["벡터/아이콘 스타일을 선택한다", "만들 항목을 한 번에 나열해 세트로 생성한다", "SVG 로 내보내 Figma·일러스트레이터에서 다듬는다"],
  },
  canva: {
    name: "Canva",
    description: "템플릿 기반 그래픽 디자인 툴. Magic Studio 로 문서·SNS·프레젠테이션을 AI 로 제작.",
    pricing: "Freemium",
    url: "https://www.canva.com",
    related: ["looka", "firefly", "capcut"],
    strengths: ["수많은 템플릿으로 누구나 빠르게 디자인", "Magic Studio 로 문구·이미지·사이즈 변환 자동화", "브랜드 키트로 팀 전체 디자인 통일"],
    howTo: ["브랜드 키트(로고·색·폰트)를 먼저 등록한다", "Magic Design 에 원하는 콘텐츠를 설명해 템플릿을 만든다", "Magic Resize 로 채널별 사이즈를 한 번에 변환한다"],
  },
  stitch: {
    name: "Stitch",
    description: "Google 의 AI UI 디자인 툴. 프롬프트로 앱 화면을 생성하고 Figma 와 코드로 내보낸다.",
    pricing: "Free",
    url: "https://stitch.withgoogle.com",
    related: ["figma", "v0", "uizard"],
    strengths: ["프롬프트·스케치로 앱 화면을 여러 버전 생성", "Figma 내보내기와 프론트엔드 코드 제공", "빠른 아이디어 탐색에 최적"],
    howTo: ["앱 목적과 필요한 화면을 설명한다", "여러 변형 중 방향을 골라 대화로 수정한다", "Figma 로 보내 다듬거나 코드로 내보낸다"],
  },
  relume: {
    name: "Relume",
    description: "프롬프트 하나로 사이트맵과 와이어프레임을 생성. Figma·Webflow 로 바로 내보낸다.",
    pricing: "Freemium",
    url: "https://www.relume.ai",
    related: ["framer", "figma"],
    strengths: ["프롬프트 하나로 사이트맵 → 와이어프레임까지", "검증된 섹션 컴포넌트 라이브러리 기반", "Figma·Webflow 로 바로 내보내기"],
    howTo: ["회사·서비스 설명과 타깃을 입력한다", "생성된 사이트맵에서 페이지·섹션을 조정한다", "와이어프레임을 확인하고 Figma/Webflow 로 내보낸다"],
  },
  spline: {
    name: "Spline",
    description: "브라우저 기반 3D 디자인 툴. AI 로 3D 오브젝트를 생성하고 웹에 인터랙티브하게 임베드.",
    pricing: "Freemium",
    url: "https://spline.design",
    related: ["meshy", "luma", "framer"],
    strengths: ["브라우저에서 바로 3D 모델링·애니메이션", "웹사이트에 인터랙티브 3D 를 간단히 임베드", "실시간 협업 지원"],
    howTo: ["기본 도형이나 AI 생성으로 오브젝트를 만든다", "재질·조명·마우스 인터랙션을 설정한다", "Export 에서 웹 임베드 코드나 React 컴포넌트로 가져온다"],
  },
  meshy: {
    name: "Meshy",
    description: "텍스트·이미지를 텍스처가 입혀진 3D 모델로 변환하는 AI. 게임·AR 에셋 제작용.",
    pricing: "Freemium",
    url: "https://www.meshy.ai",
    related: ["spline", "luma"],
    strengths: ["텍스트·이미지로 텍스처 포함 3D 모델 생성", "게임 엔진용 포맷(FBX, GLB 등)으로 내보내기", "리메시·리텍스처로 품질 보정"],
    howTo: ["오브젝트·스타일·용도(game-ready 등)를 영어로 설명한다", "프리뷰 중 가장 나은 결과를 골라 정제(Refine)한다", "필요한 포맷으로 받아 엔진에 임포트한다"],
  },
  luma: {
    name: "Luma AI",
    description: "Luma 앱에서 Ray3.2 영상 모델과 창작 에이전트를 제공한다. 여러 키프레임 지정, 영상 변형, HDR 출력까지 지원.",
    pricing: "Freemium",
    url: "https://lumalabs.ai",
    related: ["runway", "meshy", "kling"],
    strengths: ["사실적인 카메라 움직임의 영상 생성", "이미지 한 장을 자연스러운 모션 영상으로", "시작·끝 프레임 지정으로 연출 제어"],
    howTo: ["기준 이미지를 올리거나 장면을 설명한다", "카메라 움직임(dolly, orbit 등)을 명시한다", "여러 번 생성해 가장 자연스러운 컷을 고른다"],
  },
  elicit: {
    name: "Elicit",
    description: "논문 검색·요약·데이터 추출을 자동화하는 AI 리서치 어시스턴트.",
    pricing: "Freemium",
    url: "https://elicit.com",
    related: ["consensus", "perplexity", "notebooklm"],
    strengths: ["논문을 검색하고 핵심 내용을 표로 자동 추출", "수십 편의 연구를 한 번에 비교", "문헌 조사 시간을 크게 단축"],
    howTo: ["연구 질문을 영어 문장으로 입력한다", "결과 표에 필요한 열(방법론, 표본, 결론)을 추가한다", "중요한 논문은 원문을 열어 직접 확인한다"],
  },
  consensus: {
    name: "Consensus",
    description: "피어 리뷰 논문만으로 답을 찾아주는 학술 검색 엔진. 연구 합의 정도를 시각화한다.",
    pricing: "Freemium",
    url: "https://consensus.app",
    related: ["elicit", "perplexity"],
    strengths: ["피어 리뷰 논문만 검색 대상", "Consensus Meter 로 연구 결과의 합의 정도를 시각화", "질문에 대한 근거 요약을 빠르게 제공"],
    howTo: ["예/아니오로 답할 수 있는 질문 형태로 입력한다", "합의 미터와 개별 논문 요약을 확인한다", "인용할 논문은 원문과 저널을 확인한다"],
  },
  notebooklm: {
    name: "Gemini Notebook",
    description: "(구 NotebookLM, 2026년 7월 이름 변경) 내가 올린 자료만을 근거로 답하는 Google 의 AI 노트북. 오디오 오버뷰로 자료를 팟캐스트처럼 들을 수 있다.",
    pricing: "Free",
    url: "https://notebook.google.com",
    related: ["notion", "gemini", "elicit"],
    strengths: ["내가 올린 자료만 근거로 답해 지어내는 답이 적다", "답변마다 원문 위치를 인용", "오디오 오버뷰로 자료를 팟캐스트처럼 청취"],
    howTo: ["강의 PDF·슬라이드·링크를 노트북에 업로드한다", "질문하거나 학습 가이드·FAQ 를 자동 생성한다", "오디오 오버뷰를 만들어 이동 중에 복습한다"],
  },
  notion: {
    name: "Notion AI",
    description: "노트·위키·DB 가 결합된 워크스페이스의 AI. 요약, 정리, 워크스페이스 전체 검색을 지원한다.",
    pricing: "Paid",
    url: "https://www.notion.com/product/ai",
    related: ["notebooklm", "otter"],
    strengths: ["노트·할 일·DB 가 있는 워크스페이스 안에서 바로 AI 사용", "페이지 요약, 표 정리, 번역을 한 번에", "워크스페이스 전체를 검색해 답변"],
    howTo: ["노트 페이지에서 AI 를 불러 요약·재구성을 요청한다", "데이터베이스에 AI 속성을 추가해 자동 요약한다", "흩어진 노트는 'Notion AI 에게 질문'으로 찾는다"],
  },
  otter: {
    name: "Otter.ai",
    description: "실시간 음성 받아쓰기와 요약. 강의·회의를 자동으로 텍스트 노트로 남긴다.",
    pricing: "Freemium",
    url: "https://otter.ai",
    related: ["notion", "notebooklm", "vrew"],
    strengths: ["실시간 영어 음성 받아쓰기", "화자 구분과 자동 요약", "녹음 내용에 채팅으로 질문 가능"],
    howTo: ["강의·회의 시작 시 녹음을 켠다 (Zoom 연동 가능)", "끝난 뒤 자동 요약과 키워드를 확인한다", "채팅으로 특정 내용을 물어 복습한다"],
  },
  khanmigo: {
    name: "Khanmigo",
    description: "Khan Academy 의 AI 튜터. 답을 알려주기보다 질문으로 스스로 풀도록 이끈다.",
    pricing: "Freemium",
    url: "https://www.khanmigo.ai",
    related: ["chatgpt", "claude"],
    strengths: ["답을 바로 주지 않고 사고를 이끄는 소크라테스식 튜터", "Khan Academy 콘텐츠와 연결된 수학·과학 학습", "학생 수준에 맞춘 단계별 힌트"],
    howTo: ["공부할 주제와 막힌 지점을 설명한다", "질문에 스스로 답하며 단계적으로 진행한다", "틀린 부분은 힌트를 요청해 다시 시도한다"],
  },
  quizlet: {
    name: "Quizlet",
    description: "플래시카드 학습 플랫폼. AI 로 노트에서 카드와 모의 시험을 자동 생성한다.",
    pricing: "Freemium",
    url: "https://quizlet.com",
    related: ["gizmo", "knowt"],
    strengths: ["노트에서 플래시카드·퀴즈를 자동 생성", "학습 모드·테스트 모드 등 다양한 복습 방식", "수많은 공유 세트를 검색해 바로 활용"],
    howTo: ["노트나 자료를 붙여넣어 세트를 만든다", "학습 모드로 아는 것·모르는 것을 구분한다", "시험 직전엔 테스트 모드로 실전 연습을 한다"],
  },
  gizmo: {
    name: "Gizmo",
    description: "PDF·영상·노트를 넣으면 간격 반복 플래시카드와 퀴즈를 만들어주는 AI 학습 앱.",
    pricing: "Freemium",
    url: "https://gizmo.ai",
    related: ["quizlet", "knowt"],
    strengths: ["간격 반복 알고리즘으로 잊기 직전에 복습", "PDF·영상·노트에서 카드 자동 생성", "게임 요소로 매일 학습 습관 형성"],
    howTo: ["학습 자료를 업로드해 카드 덱을 만든다", "매일 알림에 맞춰 짧게 복습한다", "틀린 카드는 자동으로 더 자주 나온다"],
  },
  knowt: {
    name: "Knowt",
    description: "강의 영상·PDF 를 노트와 플래시카드로 변환하는 무료 중심의 AI 학습 툴.",
    pricing: "Freemium",
    url: "https://knowt.com",
    related: ["quizlet", "gizmo"],
    strengths: ["강의 영상·PDF 를 노트와 카드로 동시에 변환", "무료로 쓸 수 있는 기능이 많다", "Quizlet 세트 가져오기 지원"],
    howTo: ["영상 링크나 PDF 를 업로드한다", "자동 생성된 노트를 검토·보완한다", "플래시카드와 연습 테스트로 복습한다"],
  },
  deepl: {
    name: "DeepL",
    description: "자연스러운 번역 품질로 유명한 AI 번역기. DeepL Write 로 문장 교정까지.",
    pricing: "Freemium",
    url: "https://www.deepl.com",
    related: ["grammarly", "speak"],
    strengths: ["문맥을 살린 자연스러운 번역 품질", "PDF·Word 문서를 서식 그대로 번역", "DeepL Write 로 문장 교정·스타일 개선"],
    howTo: ["번역할 텍스트나 문서 파일을 올린다", "격식체/비격식체 등 어조를 선택한다", "용어집에 전공 용어를 등록해 번역을 일관되게 유지한다"],
  },
  grammarly: {
    name: "Grammarly",
    description: "영문 문법·어조·명확성 교정 AI. 에세이와 이메일 작성의 필수 보조 도구.",
    pricing: "Freemium",
    url: "https://www.grammarly.com",
    related: ["deepl", "claude"],
    strengths: ["문법·맞춤법·어조를 실시간으로 교정", "브라우저·문서 어디서나 동작", "생성형 AI 로 문장 재작성·요약"],
    howTo: ["브라우저 확장이나 앱을 설치한다", "목표(학술, 비즈니스)와 격식 수준을 설정한다", "제안된 수정을 이유와 함께 확인하며 수락한다"],
  },
  speak: {
    name: "Speak",
    description: "AI 튜터와 실시간 말하기 연습을 하는 외국어 회화 앱.",
    pricing: "Paid",
    url: "https://www.speak.com",
    related: ["deepl", "chatgpt"],
    strengths: ["AI 튜터와 실제로 말하며 연습", "발음·표현을 즉시 피드백", "상황별 롤플레이로 실전 회화 대비"],
    howTo: ["레벨과 목표(여행, 면접 등)를 설정한다", "매일 레슨으로 핵심 표현을 소리 내어 연습한다", "AI 롤플레이로 자유 대화 후 피드백을 복습한다"],
  },
  kling: {
    name: "Kling",
    description: "Kuaishou 의 영상 생성 AI. Kling 3.0 은 네이티브 4K 영상, 여러 언어 음성·립싱크, 멀티샷 스토리보드를 지원한다.",
    pricing: "Freemium",
    url: "https://kling.ai",
    related: ["runway", "veo", "luma"],
    strengths: ["네이티브 4K 고해상도 영상", "대사·음성까지 함께 생성하고 입모양 맞춤", "멀티샷 스토리보드로 장면 연결"],
    howTo: ["피사체·동작·카메라·조명·분위기를 구체적으로 적는다 (영어 권장)", "멀티샷 기능으로 장면을 나눠 구성한다", "모션 브러시로 움직일 부분을 직접 지정한다"],
  },
  runway: {
    name: "Runway",
    description: "영상 생성·편집 AI 스튜디오. Gen-4.5 로 오디오 포함·멀티샷 영상을 만들고, 배경 제거·모션 브러시 등 편집 도구를 제공한다. 실시간 월드 모델로 영역을 넓히는 중.",
    pricing: "Freemium",
    url: "https://runway.com",
    related: ["kling", "veo", "capcut"],
    strengths: ["영상 생성과 편집 도구가 한 곳에", "이미지 → 영상, 영상 → 영상 스타일 변환", "배경 제거·모션 브러시 등 VFX 도구"],
    howTo: ["기준 이미지를 올리고 움직임을 텍스트로 설명한다", "카메라 컨트롤로 앵글·무빙을 지정한다", "생성 결과를 편집 도구로 이어서 마무리한다"],
  },
  veo: {
    name: "Veo",
    description: "Google DeepMind 의 영상 생성 모델. 현재 Veo 3.1 로 대사·효과음까지 함께 만들고, Flow 에서 카메라 제어와 장면 연결이 가능하다.",
    pricing: "Paid",
    url: "https://deepmind.google/models/veo",
    related: ["kling", "runway", "gemini"],
    strengths: ["고해상도 시네마틱 영상 품질", "Flow 에서 카메라 무빙·장면 연결을 정밀하게 제어", "사운드 포함 생성"],
    howTo: ["Flow 또는 Gemini 에서 Veo 를 선택한다", "샷 종류(aerial, close-up)와 카메라 움직임을 명시한다", "여러 샷을 Flow 에서 이어 붙여 장면을 구성한다"],
  },
  capcut: {
    name: "CapCut",
    description: "모바일·데스크톱 영상 편집기. 자동 자막, 배경 제거, 템플릿, AI 효과가 풍부.",
    pricing: "Freemium",
    url: "https://www.capcut.com",
    related: ["descript", "vrew", "opusclip"],
    strengths: ["무료로도 충분한 편집 기능", "자동 자막·배경 제거·AI 효과를 원클릭으로", "트렌디한 템플릿으로 숏폼 제작이 빠르다"],
    howTo: ["영상을 불러와 타임라인에서 컷 편집한다", "자동 자막을 생성하고 스타일을 적용한다", "템플릿·효과를 입혀 9:16 으로 내보낸다"],
  },
  descript: {
    name: "Descript",
    description: "텍스트를 편집하듯 영상을 편집. 필러 단어 제거, 음성 복제, 스튜디오 사운드 지원.",
    pricing: "Freemium",
    url: "https://www.descript.com",
    related: ["capcut", "premiere", "elevenlabs"],
    strengths: ["대본 텍스트를 지우면 영상도 같이 편집", "필러 단어·침묵 자동 제거", "스튜디오 사운드로 음질 개선"],
    howTo: ["영상을 올리면 대본이 자동 생성된다", "대본에서 필요 없는 문장을 삭제한다", "AI 어시스턴트로 필러 제거·챕터 생성을 요청한다"],
  },
  premiere: {
    name: "Premiere Pro",
    description: "업계 표준 영상 편집기. Generative Extend, 음성 향상 등 Firefly 기반 AI 기능 탑재.",
    pricing: "Paid",
    url: "https://www.adobe.com/products/premiere.html",
    related: ["descript", "firefly", "runway"],
    strengths: ["업계 표준 전문 편집기", "Generative Extend 로 부족한 컷 길이를 AI 로 연장", "음성 향상·자동 보정 등 AI 기능"],
    howTo: ["소스를 가져와 시퀀스를 편집한다", "텍스트 기반 편집으로 대본에서 컷을 고른다", "AI 기능으로 오디오·색을 보정하고 내보낸다"],
  },
  vrew: {
    name: "Vrew",
    description: "음성 인식 기반 자동 자막과 컷 편집에 강한 국산 영상 편집기. 한국어 인식률이 뛰어나다.",
    pricing: "Freemium",
    url: "https://vrew.ai",
    related: ["capcut", "typecast", "descript"],
    strengths: ["한국어 음성 인식 정확도가 뛰어나다", "자막이 자동 생성되고 텍스트처럼 컷 편집", "AI 목소리·텍스트로 영상 만들기 지원"],
    howTo: ["영상을 불러오면 음성 분석으로 자막이 자동 생성된다", "오타·싱크를 문서 편집하듯 고친다", "자막 스타일을 지정하고 내보낸다"],
  },
  heygen: {
    name: "HeyGen",
    description: "AI 아바타 영상과 립싱크 다국어 더빙. 얼굴·목소리를 유지한 채 번역 영상을 만든다.",
    pricing: "Freemium",
    url: "https://www.heygen.com",
    related: ["elevenlabs", "typecast"],
    strengths: ["AI 아바타로 촬영 없이 발표 영상 제작", "입모양까지 맞춘 다국어 더빙", "내 얼굴·목소리로 아바타 생성 가능"],
    howTo: ["아바타를 고르거나 내 아바타를 만든다", "대본을 입력하고 언어·목소리를 선택한다", "번역 기능으로 기존 영상을 다국어 버전으로 변환한다"],
  },
  typecast: {
    name: "Typecast",
    description: "감정 표현이 가능한 한국어 AI 성우(TTS). 내레이션과 캐릭터 보이스 제작용.",
    pricing: "Freemium",
    url: "https://typecast.ai",
    related: ["elevenlabs", "vrew", "heygen"],
    strengths: ["자연스러운 한국어 AI 성우", "감정·속도·톤을 문장 단위로 조절", "다양한 캐릭터 보이스"],
    howTo: ["대본을 붙여넣고 캐릭터 보이스를 고른다", "문장별로 감정·속도를 조절한다", "오디오 파일로 받아 편집기에 넣는다"],
  },
  opusclip: {
    name: "OpusClip",
    description: "긴 영상에서 바이럴 가능성 높은 구간을 찾아 세로 숏폼으로 자동 편집한다.",
    pricing: "Freemium",
    url: "https://www.opus.pro",
    related: ["submagic", "vizard", "capcut"],
    strengths: ["긴 영상에서 하이라이트를 AI 가 자동 발굴", "바이럴 점수로 클립 우선순위 제시", "자동 리프레이밍·자막으로 바로 업로드 가능"],
    howTo: ["유튜브 링크나 영상 파일을 올린다", "원하는 주제·길이를 프롬프트로 지정한다", "추천 클립을 검토하고 자막 스타일을 적용해 내보낸다"],
  },
  submagic: {
    name: "Submagic",
    description: "트렌디한 애니메이션 자막, 이모지, B-roll 을 자동으로 입히는 숏폼 편집 AI.",
    pricing: "Paid",
    url: "https://www.submagic.co",
    related: ["opusclip", "capcut"],
    strengths: ["트렌디한 애니메이션 자막 자동 생성", "이모지·B-roll·효과음 자동 삽입", "숏폼 제작 시간을 크게 단축"],
    howTo: ["세로 영상을 업로드한다", "자막 템플릿과 강조 스타일을 고른다", "자동 추가된 요소를 확인하고 내보낸다"],
  },
  vizard: {
    name: "Vizard",
    description: "웨비나·팟캐스트 영상을 클립으로 잘라 자막과 함께 멀티 채널에 게시한다.",
    pricing: "Freemium",
    url: "https://vizard.ai",
    related: ["opusclip", "submagic"],
    strengths: ["웨비나·팟캐스트를 여러 클립으로 자동 분할", "브랜드 템플릿 적용", "여러 SNS 채널에 예약 게시"],
    howTo: ["긴 영상을 업로드한다", "AI 가 제안한 클립을 골라 수정한다", "채널별 사이즈로 변환해 예약 게시한다"],
  },
  suno: {
    name: "Suno",
    description: "가사와 스타일만 입력하면 보컬 포함 완곡을 생성하는 음악 AI. 2026년 Warner 등과 라이선스 계약한 v6 모델로 전환, 파일 다운로드는 유료 요금제.",
    pricing: "Freemium",
    url: "https://suno.com",
    related: ["stableaudio", "elevenlabs"],
    strengths: ["가사·스타일만으로 보컬 포함 완곡 생성", "넓은 장르 표현력", "곡 연장으로 원하는 길이에 맞추기"],
    howTo: ["장르·분위기·BPM·악기를 스타일 칸에 적는다", "직접 쓴 가사나 자동 가사를 사용한다", "마음에 드는 버전을 연장해 영상 길이에 맞춘다"],
  },
  stableaudio: {
    name: "Stable Audio",
    description: "Stability AI 의 음악·효과음 생성 AI. 2026년 5월 공개된 3.0 은 라이선스 데이터로만 학습했고 6분이 넘는 곡도 만든다.",
    pricing: "Freemium",
    url: "https://stableaudio.com",
    related: ["suno", "elevenlabs"],
    strengths: ["라이선스 데이터로만 학습해 저작권 부담이 적다", "6분 이상의 긴 트랙 생성", "만든 결과물을 받아 상업적으로 사용 가능 (연매출 100만 달러 이상 기업은 별도 라이선스)"],
    howTo: ["장르·분위기·BPM·악기·용도를 적는다", "영상 길이에 맞춰 트랙 길이를 지정한다", "결과물을 받아 편집기에서 영상에 맞춘다"],
  },
  elevenlabs: {
    name: "ElevenLabs",
    description: "가장 자연스러운 AI 음성. TTS, 음성 복제, 효과음 생성, 다국어 더빙까지.",
    pricing: "Freemium",
    url: "https://elevenlabs.io",
    related: ["typecast", "heygen", "suno"],
    strengths: ["사람 같은 자연스러운 음성 합성", "텍스트로 효과음 생성", "음성 복제·다국어 더빙 지원"],
    howTo: ["TTS 는 대본과 목소리를 골라 생성한다", "효과음은 소리 상황을 구체적으로 영어로 설명한다", "여러 버전을 들어보고 골라 받는다"],
  },
});

export type ToolKey = keyof typeof TOOL_TABLE;
export const TOOLS: Record<ToolKey, ToolInfo> = TOOL_TABLE as Record<ToolKey, ToolInfo>;

/* ────────────────────────────────────────────────────────────
 * ARCHIVE TREE
 * ──────────────────────────────────────────────────────────── */

export const ARCHIVE: Category[] = [
  {
    slug: "developer",
    index: "01",
    name: "개발자",
    nameEn: "DEVELOPER",
    accent: "#00F0FF",
    icon: CodeXml,
    tagline: "디자인 시안부터 배포까지, 코드를 쓰는 모든 순간",
    fields: [
      {
        id: "design",
        name: "디자인",
        nameEn: "DESIGN",
        icon: PenTool,
        tools: [
          { tool: "figma", useCase: "UI 디자인 툴", tag: "디자인", recommendation: "화면 설계와 디자이너와의 핸드오프는 Figma 로. Dev Mode 로 스펙을 바로 확인하라.", prompt: "SaaS 대시보드 첫 화면을 만들어줘.\n- 왼쪽 사이드바: 홈, 프로젝트, 팀, 설정\n- 상단: 검색창, 알림, 프로필\n- 본문: KPI 카드 4개 + 최근 활동 테이블\n- 다크 테마, 8pt 그리드, 모든 레이어 오토 레이아웃" },
          { tool: "gemini", useCase: "디자인 시안 생성", tag: "이미지 생성", recommendation: "디자이너 없이 시안 방향을 잡아야 할 때, Gemini 로 무드와 레이아웃 시안을 빠르게 뽑아라.", prompt: "[반려식물 관리 앱]의 모바일 홈 화면 디자인 시안 이미지를 3가지 스타일로 만들어줘.\n① 미니멀 화이트 ② 다크 네온 ③ 파스텔 일러스트\n각 시안마다 색상 팔레트(HEX)와 추천 폰트도 적어줘." },
          { tool: "v0", useCase: "UI 컴포넌트 생성", tag: "코드 생성", recommendation: "대시보드·폼 같은 표준 UI 는 v0 로 뼈대를 만들고 코드로 가져와 다듬어라.", prompt: "Next.js + Tailwind + shadcn/ui 로 가격표 섹션을 만들어줘.\n- 플랜 3개: Free / Pro / Team\n- 월간·연간 토글 (연간 20% 할인 배지)\n- Pro 플랜 강조 스타일\n- 모바일에서는 세로로 쌓이게, aria 속성 포함" },
        ],
      },
      {
        id: "frontend",
        name: "프론트엔드",
        nameEn: "FRONTEND",
        icon: LayoutTemplate,
        tools: [
          { tool: "claude", useCase: "디자인 → 코드 변환", tag: "코드 생성", recommendation: "시안 스크린샷을 그대로 붙여넣고 컴포넌트 코드로 변환할 땐 Claude 가 가장 충실하다.", prompt: "첨부한 디자인 스크린샷을 React + TypeScript + Tailwind 컴포넌트로 변환해줘.\n- 간격·폰트 크기를 최대한 똑같이 맞출 것\n- 반복 요소는 props 를 받는 하위 컴포넌트로 분리\n- 반응형: 모바일 390px / 데스크톱 1440px\n- 이미지는 placeholder 로\n마지막에 디자인과 다를 수 있는 부분을 목록으로 알려줘." },
          { tool: "cursor", useCase: "AI 코드 에디터", tag: "에디터", recommendation: "매일 쓰는 에디터 자체를 AI 로 바꾸고 싶다면 Cursor. 다중 파일 리팩터링에 특히 강하다.", prompt: "@src/components 안의 모든 Button 사용처를 새 <Button variant> API 로 바꿔줘.\n기존 className 조합은 variant='primary' | 'ghost' | 'danger' 로 매핑하고,\n작업이 끝나면 바꾼 파일 목록과 매핑 표를 보여줘." },
          { tool: "bolt", useCase: "풀스택 앱 프로토타이핑", tag: "프로토타입", recommendation: "아이디어 검증용 MVP 를 한 시간 안에 띄워야 한다면 Bolt.new.", prompt: "할 일 관리 웹앱 MVP 를 만들어줘.\n기능: 이메일 로그인, 프로젝트별 할 일 목록, 마감일·우선순위, 드래그로 순서 변경\n스택: React + Vite + Tailwind + Supabase\n첫 화면은 샘플 데이터로 바로 동작하게 해줘." },
        ],
      },
      {
        id: "backend",
        name: "백엔드",
        nameEn: "BACKEND",
        icon: Server,
        tools: [
          { tool: "claudecode", useCase: "터미널 에이전트 코딩", tag: "에이전트", recommendation: "API 설계부터 테스트, 마이그레이션까지 저장소 단위 작업은 Claude Code 에 맡겨라.", prompt: "이 저장소의 주문 API 에 환불 기능을 추가해줘.\n1) 관련 코드를 읽고 구현 계획부터 보여줘 (아직 수정하지 말 것)\n2) 계획을 승인하면 POST /orders/:id/refund 구현 (부분 환불 지원)\n3) 단위 테스트 작성 후 전체 테스트 실행\n4) 변경 요약과 커밋 메시지 제안" },
          { tool: "copilot", useCase: "코드 자동완성 & PR 리뷰", tag: "코드 생성", recommendation: "GitHub 중심 팀이라면 Copilot 으로 자동완성과 PR 리뷰를 한 번에 해결하라.", prompt: "/tests 선택한 PaymentService 클래스의 Jest 단위 테스트를 작성해줘.\n정상 결제, 잔액 부족, 외부 API 타임아웃 3가지 케이스를 포함하고 외부 호출은 mock 처리해줘." },
          { tool: "supabase", useCase: "SQL · 스키마 생성", tag: "데이터베이스", recommendation: "DB 스키마와 RLS 정책을 자연어로 짜고 싶다면 Supabase AI.", prompt: "users, workspaces, workspace_members(역할: owner / editor / viewer) 테이블을 만들어줘.\n워크스페이스 멤버만 해당 데이터를 읽을 수 있고, owner 만 멤버를 추가·삭제할 수 있도록 RLS 정책도 작성해줘." },
        ],
      },
      {
        id: "ai",
        name: "인공지능",
        nameEn: "AI MODELS",
        icon: BrainCircuit,
        tools: [
          { tool: "chatgpt", useCase: "범용 AI 어시스턴트", tag: "LLM", recommendation: "무엇이든 일단 물어볼 첫 창구. 이미지·음성·에이전트까지 올인원이 필요할 때.", prompt: "나는 3년 차 백엔드 개발자야. 아래 에러의 원인 후보를 가능성 높은 순으로 3개 알려주고,\n각각 확인 방법(명령어 포함)과 해결 코드를 보여줘.\n\n[에러 로그 붙여넣기]" },
          { tool: "claude", useCase: "긴 코드 · 문서 분석", tag: "LLM", recommendation: "수천 줄 코드나 긴 스펙 문서를 통째로 넣고 분석할 땐 Claude.", prompt: "첨부한 코드 파일들을 읽고 정리해줘.\n1) 전체 아키텍처 한 문단 요약\n2) 주요 모듈과 의존 관계\n3) 성능·보안상 위험해 보이는 부분 TOP 5 와 이유\n4) 신규 입사자가 먼저 읽어야 할 파일 순서" },
          { tool: "gemini", useCase: "멀티모달 & 긴 컨텍스트", tag: "LLM", recommendation: "영상·이미지·PDF 를 섞어 분석하거나 Google 생태계와 연동할 땐 Gemini.", prompt: "첨부한 화면 녹화 영상에서 버그가 재현되는 순간을 찾아 타임스탬프와 재현 단계를 정리해줘.\n그리고 첨부한 컴포넌트 코드에서 원인일 가능성이 높은 부분을 짚어줘." },
          { tool: "perplexity", useCase: "출처 기반 기술 검색", tag: "검색", recommendation: "최신 라이브러리 버전이나 에러 해결법을 출처와 함께 찾을 땐 Perplexity.", prompt: "[라이브러리 이름] 최신 메이저 버전에서 바뀐 점과 마이그레이션 시 주의할 점을\n공식 문서와 릴리스 노트 기준으로 정리해줘. 항목마다 출처 링크를 달아줘." },
        ],
      },
      {
        id: "devops",
        name: "배포/DevOps",
        nameEn: "DEVOPS",
        icon: Rocket,
        tools: [
          { tool: "vercel", useCase: "프론트엔드 배포", tag: "배포", recommendation: "Next.js 앱이라면 고민하지 말고 Vercel. PR 마다 프리뷰 URL 이 생긴다." },
          { tool: "netlify", useCase: "정적 사이트 호스팅", tag: "배포", recommendation: "정적 사이트·문서 사이트를 폼 기능과 함께 가볍게 띄울 땐 Netlify." },
          { tool: "railway", useCase: "서버 · DB 인프라", tag: "인프라", recommendation: "백엔드 서버와 Postgres·Redis 를 한 프로젝트로 묶어 배포할 땐 Railway." },
        ],
      },
    ],
  },
  {
    slug: "designer",
    index: "02",
    name: "디자이너",
    nameEn: "DESIGNER",
    accent: "#FF2E88",
    icon: Palette,
    tagline: "영감에서 픽셀까지, 상상을 형태로 만드는 도구",
    fields: [
      {
        id: "uiux",
        name: "UI/UX",
        nameEn: "UI / UX",
        icon: PenTool,
        tools: [
          { tool: "figma", useCase: "UI 디자인 & 프로토타입", tag: "디자인", recommendation: "모든 UI 작업의 기본 캔버스. Figma AI 로 반복 작업(리네이밍·목업)을 자동화하라.", prompt: "모바일 핀테크 앱의 송금 플로우를 만들어줘.\n받는 사람 선택 → 금액 입력(키패드) → 확인 → 완료, 총 4개 화면.\n브랜드 컬러 #3B5BFF, iOS 스타일, 모든 레이어 오토 레이아웃 + 컴포넌트화." },
          { tool: "framer", useCase: "AI 웹사이트 빌더", tag: "웹 퍼블리싱", recommendation: "디자인한 그대로 실제 사이트로 퍼블리시해야 한다면 Framer.", prompt: "건축 스튜디오 포트폴리오 웹사이트를 만들어줘.\n톤: 미니멀, 흑백 + 포인트 컬러 테라코타\n섹션: 풀스크린 히어로 이미지, 프로젝트 그리드(호버 시 확대), 스튜디오 소개, 연락처\n스크롤할 때 요소가 부드럽게 등장하는 애니메이션 포함." },
          { tool: "uizard", useCase: "스케치 → UI 목업", tag: "목업", recommendation: "화이트보드 스케치를 5분 만에 클릭 가능한 목업으로 만들 땐 Uizard.", prompt: "요가 클래스 예약 앱을 만들어줘.\n화면: 온보딩 3장, 클래스 목록(시간·난이도 필터), 강사 상세, 예약 확인\n분위기: 차분한 세이지 그린, 둥근 카드 UI" },
        ],
      },
      {
        id: "image",
        name: "이미지 생성",
        nameEn: "IMAGE GEN",
        icon: Sparkles,
        tools: [
          { tool: "midjourney", useCase: "키비주얼 · 컨셉 아트", tag: "이미지 생성", recommendation: "미감이 최우선인 무드보드와 키비주얼은 Midjourney 를 넘을 툴이 없다.", prompt: "minimal skincare product key visual, frosted glass bottle on wet stone, soft morning light, water droplets, beige and sage palette, editorial photography, shallow depth of field --ar 4:5 --style raw" },
          { tool: "firefly", useCase: "상업용 안전 이미지", tag: "이미지 생성", recommendation: "클라이언트 납품용이라 저작권이 걱정된다면 Firefly 로 생성하라.", prompt: "흰 배경 위 친환경 텀블러 제품 사진, 부드러운 스튜디오 조명, 옆에 유칼립투스 가지, 미니멀 구도, 오른쪽에 카피를 넣을 넓은 여백, 광고용 고해상도" },
          { tool: "ideogram", useCase: "타이포 포함 이미지", tag: "타이포그래피", recommendation: "글자가 정확히 들어가야 하는 포스터·썸네일은 Ideogram.", prompt: "Retro jazz festival poster, bold title text \"SEOUL JAZZ NIGHT\", subtitle \"Oct 24 · Olympic Park\", 1970s Swiss typography, orange and navy, halftone paper texture" },
        ],
      },
      {
        id: "branding",
        name: "브랜딩/로고",
        nameEn: "BRANDING",
        icon: Shapes,
        tools: [
          { tool: "looka", useCase: "로고 & 브랜드 키트", tag: "브랜딩", recommendation: "스타트업 초기 로고와 브랜드 키트를 하루 만에 확보해야 할 땐 Looka.", prompt: "브랜드명: 모닝브루\n업종: 스페셜티 커피\n키워드: 따뜻함, 장인정신, 아침\n선호 색: 브라운·크림\n스타일: 심볼 + 워드마크, 둥근 세리프 서체" },
          { tool: "recraft", useCase: "벡터 아이콘 · 일러스트", tag: "벡터", recommendation: "일관된 스타일의 SVG 아이콘 세트가 필요하다면 Recraft.", prompt: "flat line icon set for a travel app, 12 icons: flight, hotel, map pin, passport, luggage, camera, ticket, compass, beach, train, wallet, calendar. 2px stroke, rounded caps, 24px grid, single color" },
          { tool: "canva", useCase: "SNS · 마케팅 그래픽", tag: "그래픽", recommendation: "브랜드 가이드를 적용한 SNS 콘텐츠를 대량으로 찍어낼 땐 Canva.", prompt: "우리 카페 가을 신메뉴 '밤 라떼' 인스타그램 피드 게시물 3종을 만들어줘.\n브랜드 색상 브라운·크림, 따뜻한 감성, 가격 5,800원, '10월 한정' 문구 포함." },
        ],
      },
      {
        id: "wireframe",
        name: "와이어프레임",
        nameEn: "WIREFRAME",
        icon: LayoutTemplate,
        tools: [
          { tool: "stitch", useCase: "프롬프트 → 앱 화면", tag: "UI 생성", recommendation: "앱 화면 초안을 여러 버전으로 빠르게 탐색할 땐 Stitch.", prompt: "독서 기록 앱의 모바일 화면 4개를 만들어줘.\n홈(오늘 읽은 페이지 그래프), 책 검색, 책 상세(별점·메모), 월간 통계\n라이트 모드, 차분한 네이비 포인트, 카드형 UI" },
          { tool: "relume", useCase: "사이트맵 & 와이어프레임", tag: "IA 설계", recommendation: "웹사이트 정보구조(IA)와 섹션 구성을 먼저 잡아야 할 땐 Relume.", prompt: "스타트업용 회계 자동화 SaaS 의 마케팅 웹사이트.\n타깃: 스타트업 재무 담당자\n페이지: 홈, 기능, 가격, 고객 사례, 블로그, 문의\n홈에서는 고객 로고·보안 인증 같은 신뢰 요소를 강조해줘." },
          { tool: "v0", useCase: "동작하는 UI 프로토타입", tag: "코드 생성", recommendation: "개발자에게 '진짜 동작하는' 프로토타입을 넘기고 싶다면 v0.", prompt: "첨부한 와이어프레임을 실제로 클릭 가능한 프로토타입으로 만들어줘.\n탭 전환, 모달 열기/닫기, 폼 유효성 검사 메시지까지 동작하게.\n디자인은 흑백 와이어프레임 스타일 그대로 유지." },
        ],
      },
      {
        id: "3d",
        name: "3D & 모션",
        nameEn: "3D & MOTION",
        icon: Box,
        tools: [
          { tool: "spline", useCase: "웹용 인터랙티브 3D", tag: "3D", recommendation: "랜딩 페이지에 인터랙티브 3D 오브젝트를 올릴 땐 Spline.", prompt: "a glossy chrome abstract blob with soft iridescent reflections, floating and slowly rotating, studio lighting" },
          { tool: "meshy", useCase: "텍스트 → 3D 모델", tag: "3D 생성", recommendation: "게임·AR 용 3D 에셋을 모델링 없이 뽑아야 한다면 Meshy.", prompt: "low-poly cute cactus character in a terracotta pot, big round eyes, stylized, game-ready, PBR textures" },
          { tool: "luma", useCase: "이미지 → 모션", tag: "모션", recommendation: "정지 이미지 시안에 자연스러운 카메라 무빙을 입힐 땐 Luma.", prompt: "첨부한 제품 이미지를 기준으로, 카메라가 제품 주위를 천천히 반 바퀴 도는 5초 영상. 부드러운 스튜디오 조명, 배경은 흐리게." },
        ],
      },
    ],
  },
  {
    slug: "study",
    index: "03",
    name: "공부",
    nameEn: "STUDY",
    accent: "#C6FF00",
    icon: GraduationCap,
    tagline: "찾고, 이해하고, 기억하는 — 학습의 전 과정",
    fields: [
      {
        id: "research",
        name: "리서치",
        nameEn: "RESEARCH",
        icon: ScanSearch,
        tools: [
          { tool: "perplexity", useCase: "출처 기반 AI 검색", tag: "검색", recommendation: "과제 자료 조사의 첫 단계. 답변마다 출처가 달려 검증이 쉽다.", prompt: "'수면 부족이 기억력에 미치는 영향'에 대해 최근 5년 연구 위주로 핵심 결론 5가지를 정리해줘.\n결론마다 출처 링크와 연구 규모(표본 수)를 적어줘." },
          { tool: "elicit", useCase: "논문 검색 · 요약", tag: "논문", recommendation: "관련 논문 수십 편을 표로 비교·요약해야 할 땐 Elicit.", prompt: "Does spaced repetition improve long-term retention in university students compared to massed practice?" },
          { tool: "consensus", useCase: "학술 근거 확인", tag: "논문", recommendation: "'과학적으로 사실인가?' 를 확인할 땐 Consensus 의 합의 미터를 보라.", prompt: "Is intermittent fasting more effective for weight loss than daily calorie restriction?" },
        ],
      },
      {
        id: "notes",
        name: "노트 · 정리",
        nameEn: "NOTES",
        icon: NotebookPen,
        tools: [
          { tool: "notebooklm", useCase: "내 자료 기반 Q&A", tag: "노트", recommendation: "강의 자료·교재 PDF 를 넣고 시험 범위만 파고들 땐 NotebookLM.", prompt: "업로드한 강의 자료만 근거로 중간고사 예상 문제 10개를 만들어줘.\n객관식 5개, 서술형 5개. 문제마다 정답과 근거가 된 자료 위치를 인용해줘." },
          { tool: "notion", useCase: "노트 정리 · 요약", tag: "워크스페이스", recommendation: "학기 전체 노트를 한 곳에 쌓고 요약·검색하려면 Notion AI.", prompt: "이 페이지의 강의 노트를 다음처럼 재구성해줘.\n① 핵심 개념 5줄 요약\n② 용어 정리 표 (용어 / 정의 / 예시)\n③ 헷갈리기 쉬운 포인트 3개" },
          { tool: "otter", useCase: "강의 녹음 → 텍스트", tag: "받아쓰기", recommendation: "영어 강의를 실시간 받아쓰기하고 요약본까지 받고 싶다면 Otter.", prompt: "이번 강의에서 교수님이 '시험에 나온다'고 강조한 부분만 타임스탬프와 함께 뽑아줘." },
        ],
      },
      {
        id: "tutor",
        name: "튜터 · 질의응답",
        nameEn: "AI TUTOR",
        icon: MessagesSquare,
        tools: [
          { tool: "chatgpt", useCase: "스터디 모드 튜터", tag: "튜터", recommendation: "모르는 개념을 단계별로 질문받으며 이해하고 싶다면 ChatGPT 스터디 모드.", prompt: "스터디 모드로 도와줘. 나는 고등학교 2학년이고 미분의 정의가 잘 이해가 안 돼.\n답을 바로 알려주지 말고, 내가 어디까지 아는지 질문으로 확인하면서 단계별로 이끌어줘." },
          { tool: "claude", useCase: "개념 설명 · 풀이 검토", tag: "튜터", recommendation: "내 풀이를 붙여넣고 어디서 틀렸는지 논리적으로 짚어받을 땐 Claude.", prompt: "아래는 내 풀이야.\n정답 여부만 말하지 말고, 논리가 처음 틀어진 줄을 찾아 왜 틀렸는지 설명해줘.\n그다음 내가 스스로 고칠 수 있게 힌트만 줘.\n\n[풀이 붙여넣기]" },
          { tool: "khanmigo", useCase: "소크라테스식 튜터링", tag: "튜터", recommendation: "답 대신 힌트로 스스로 풀게 만드는 튜터가 필요하다면 Khanmigo.", prompt: "광합성의 빛 반응과 암반응 차이를 이해하고 싶어. 설명 대신 퀴즈로 하나씩 물어봐 줘." },
        ],
      },
      {
        id: "memorize",
        name: "암기 · 퀴즈",
        nameEn: "MEMORIZE",
        icon: Brain,
        tools: [
          { tool: "quizlet", useCase: "플래시카드 & 모의고사", tag: "암기", recommendation: "단어·용어 암기는 Quizlet 의 AI 카드 생성과 학습 모드로.", prompt: "이 노트로 플래시카드 30장과 20문항 모의고사를 만들어줘.\n용어-정의 형식으로, 헷갈리기 쉬운 오답 보기도 포함해줘." },
          { tool: "gizmo", useCase: "간격 반복 퀴즈", tag: "암기", recommendation: "잊을 때쯤 다시 물어보는 간격 반복 학습이 필요하다면 Gizmo.", prompt: "첨부한 PDF 에서 핵심 개념 플래시카드를 만들어줘. 앞면은 질문, 뒷면은 한 문장 답으로." },
          { tool: "knowt", useCase: "강의 → 노트 · 카드", tag: "암기", recommendation: "강의 영상 하나로 노트와 카드를 동시에 만들 땐 Knowt.", prompt: "이 강의 영상으로 요약 노트와 플래시카드를 만들어줘. 시험 대비용으로 정의·공식·예시 중심으로." },
        ],
      },
      {
        id: "language",
        name: "글쓰기 · 어학",
        nameEn: "LANGUAGE",
        icon: Languages,
        tools: [
          { tool: "deepl", useCase: "고품질 번역", tag: "번역", recommendation: "영어 논문·원서를 자연스러운 한국어로 읽고 싶다면 DeepL." },
          { tool: "grammarly", useCase: "영문 교정", tag: "교정", recommendation: "영어 에세이·이메일 제출 전 마지막 점검은 Grammarly.", prompt: "Make this essay sound more academic and concise. Keep my original arguments and explain each major change." },
          { tool: "speak", useCase: "AI 회화 연습", tag: "회화", recommendation: "말하기 시험이나 면접 대비 스피킹 연습은 Speak.", prompt: "카페에서 음료를 주문하면서 알레르기를 설명하는 상황으로 롤플레이 해줘. 내가 틀린 표현은 대화가 끝난 뒤 정리해줘." },
        ],
      },
    ],
  },
  {
    slug: "video",
    index: "04",
    name: "영상 편집",
    nameEn: "VIDEO EDITING",
    accent: "#FF6B00",
    icon: Clapperboard,
    tagline: "생성, 컷, 자막, 사운드 — 한 편의 영상이 완성되기까지",
    fields: [
      {
        id: "generate",
        name: "영상 생성",
        nameEn: "GENERATION",
        icon: WandSparkles,
        tools: [
          { tool: "kling", useCase: "텍스트 → 4K 영상", tag: "영상 생성", recommendation: "대사가 있는 고해상도 장면이나 여러 컷을 이어 붙인 짧은 이야기가 필요할 땐 Kling.", prompt: "A golden retriever running along a misty beach at sunrise, slow motion, low-angle tracking shot, warm soft light, waves crashing, cinematic 35mm film look, ambient ocean sound." },
          { tool: "runway", useCase: "영상 생성 & VFX", tag: "영상 생성", recommendation: "생성과 편집(배경 제거, 모션 브러시)을 한 곳에서 하려면 Runway.", prompt: "Slow dolly-in on a rainy neon-lit Seoul alley at night, reflections on wet pavement, a person with a clear umbrella walks away from camera, cinematic and moody." },
          { tool: "veo", useCase: "시네마틱 샷 생성", tag: "영상 생성", recommendation: "카메라 무빙을 정밀하게 제어한 시네마틱 샷은 Veo + Flow.", prompt: "Aerial drone shot rising over a foggy pine forest at dawn, camera slowly tilts up to reveal snow-capped mountains, golden light, epic orchestral mood." },
        ],
      },
      {
        id: "cut",
        name: "컷 편집",
        nameEn: "EDITING",
        icon: Scissors,
        tools: [
          { tool: "capcut", useCase: "올인원 영상 편집", tag: "편집", recommendation: "유튜브·SNS 영상 대부분은 CapCut 하나로 충분하다." },
          { tool: "descript", useCase: "텍스트 기반 편집", tag: "편집", recommendation: "인터뷰·팟캐스트처럼 말이 중심인 영상은 Descript 로 대본을 지우듯 편집하라.", prompt: "필러 단어(음, 어)를 모두 지우고, 3초 이상 침묵은 0.5초로 줄여줘.\n그다음 유튜브용 챕터 제목을 타임스탬프와 함께 만들어줘." },
          { tool: "premiere", useCase: "프로 편집 + AI", tag: "편집", recommendation: "색보정·멀티캠이 필요한 본격 작업은 Premiere Pro 의 AI 기능과 함께." },
        ],
      },
      {
        id: "subtitle",
        name: "자막 · 음성",
        nameEn: "SUBTITLE & VOICE",
        icon: Captions,
        tools: [
          { tool: "vrew", useCase: "한국어 자동 자막", tag: "자막", recommendation: "한국어 자막을 가장 정확하고 빠르게 뽑아야 한다면 Vrew." },
          { tool: "typecast", useCase: "한국어 AI 성우", tag: "TTS", recommendation: "감정이 담긴 한국어 내레이션이 필요할 땐 Typecast." },
          { tool: "heygen", useCase: "아바타 · 다국어 더빙", tag: "더빙", recommendation: "내 영상을 입모양까지 맞춰 해외 언어로 더빙하려면 HeyGen." },
        ],
      },
      {
        id: "shortform",
        name: "숏폼 · 리퍼포징",
        nameEn: "SHORT-FORM",
        icon: Smartphone,
        tools: [
          { tool: "opusclip", useCase: "롱폼 → 숏폼 자동 추출", tag: "숏폼", recommendation: "라이브·팟캐스트에서 하이라이트 숏츠를 뽑아낼 땐 OpusClip.", prompt: "Find the funniest and most quotable moments about startup failures, 30–60 seconds each, vertical 9:16, with animated captions." },
          { tool: "submagic", useCase: "트렌디 자막 · 이펙트", tag: "숏폼", recommendation: "릴스·틱톡 스타일의 화려한 자막을 자동으로 입히려면 Submagic." },
          { tool: "vizard", useCase: "멀티 채널 클립 배포", tag: "숏폼", recommendation: "웨비나 한 편을 여러 채널용 클립으로 쪼개 예약 게시할 땐 Vizard." },
        ],
      },
      {
        id: "sound",
        name: "음악 · 사운드",
        nameEn: "MUSIC & SFX",
        icon: Music,
        tools: [
          { tool: "suno", useCase: "보컬 포함 곡 생성", tag: "음악", recommendation: "영상 분위기에 맞는 오리지널 곡이 필요하다면 Suno.", prompt: "Style: lo-fi hip hop, mellow piano, vinyl crackle, 80 BPM, instrumental\nTitle: 새벽 공부" },
          { tool: "stableaudio", useCase: "저작권 걱정 적은 BGM", tag: "음악", recommendation: "영상에 넣을 BGM 을 받아서 상업적으로 쓰려면 라이선스 데이터로 학습한 Stable Audio.", prompt: "cinematic ambient build-up, soft strings and pulsing synth, hopeful mood, for a product launch video, instrumental, 90 seconds" },
          { tool: "elevenlabs", useCase: "효과음 · 음성 생성", tag: "사운드", recommendation: "딱 맞는 효과음이나 자연스러운 영어 내레이션은 ElevenLabs.", prompt: "heavy wooden door creaking open slowly in a large stone hall, with echo" },
        ],
      },
    ],
  },
];

/** 툴 정보(최신 모델·서비스 상태·주소)를 마지막으로 확인한 날짜 */
export const ARCHIVE_CHECKED = "2026-09-30";

/* ────────────────────────────────────────────────────────────
 * HELPERS
 * ──────────────────────────────────────────────────────────── */

export const getCategory = (slug: string) => ARCHIVE.find((c) => c.slug === slug);

export const countTools = (c: Category) => c.fields.reduce((n, f) => n + f.tools.length, 0);

export const ALL_TOOL_NAMES = Array.from(
  new Set(ARCHIVE.flatMap((c) => c.fields.flatMap((f) => f.tools.map((t) => TOOLS[t.tool].name)))),
);
