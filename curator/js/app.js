/* =========================================================
   화면 코드
   ========================================================= */
const $ = (s) => document.querySelector(s);

// AI ARCHIVE 링크: npm run dev 로 띄운 경우(localhost)는 로컬 AI ARCHIVE(localhost:3000), 그 밖(배포·파일 더블클릭)은 배포된 주소
// 키오스크(/news/ 경로)에서는 같은 주소의 AI ARCHIVE(/)로
const ARCHIVE_URL = location.pathname.startsWith("/news/") ? "/"
  : ["localhost", "127.0.0.1"].includes(location.hostname) ? "http://localhost:3000/" : "https://ai-archive-weld.vercel.app/";
document.querySelectorAll("a.to-archive").forEach((a) => (a.href = ARCHIVE_URL));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const logo = (co, size) => {
  const c = COMPANIES[co];
  const inner = c.img ? `<img src="${c.img}" alt="">` : `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[co] || ""}</svg>`;
  return `<span class="logo-c" title="${c.name}" style="--c:${c.c}${size ? `;width:${size}px;height:${size}px` : ""}">${inner}</span>`;
};
const modelLogo = (m, size) => {
  const src = MODEL_LOGOS[m.logo];
  if (!src) return logo(m.co, size);
  return `<span class="logo-c" title="${esc(m.name)}" style="--c:#fff${size ? `;width:${size}px;height:${size}px` : ""}"><img src="${src}" alt=""></span>`;
};

// ---- 한눈에 보기 카드 (전부 실제 데이터에서 계산) ----
const daysAgo = (n) => { const d = new Date(CHECKED); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
function renderIdx() {
  const since = daysAgo(30);
  const newCount = Object.values(TIMELINES).flat().filter((e) => e.kind === "release" && e.date >= since).length;
  const cheapest = [...MODELS].sort((a, b) => blended(a) - blended(b))[0];
  const newest = byNewest(MODELS)[0];
  const freeCount = Object.values(SUBSCRIPTIONS).filter((s) => s.plans.some((p) => p[1] === 0)).length;
  const items = [
    { k: "최근 30일 새 모델", v: `${newCount}개`, sub: "한 달 동안 공식 출시된 AI 모델 수예요", chart: monthBars() },
    { k: "가장 최근 출시", v: esc(newest.name), sub: `${COMPANIES[newest.co].name} · ${newest.date.replaceAll("-", ".")}`, small: true },
    { k: "가장 저렴한 API", v: `${usd(cheapest.price.in)} / ${usd(cheapest.price.out)}`, sub: `${esc(cheapest.name)} · 100만 토큰당 입력 / 출력` },
    { k: "무료로 쓸 수 있는 AI", v: `${freeCount}곳`, sub: "가입만 하면 무료 요금제가 있는 서비스예요" },
  ];
  $("#idx").innerHTML = items.map((it) => `
    <div class="ix">
      <span class="k">${it.k}</span>
      <span class="v num"${it.small ? ' style="font-size:20px"' : ""}>${it.v}</span>
      <span class="d" style="color:var(--sub)">${it.sub}</span>${it.chart || ""}
    </div>`).join("");
}
// 최근 12개월 월별 공식 출시 수 (진화 타임라인의 출시 기록으로 계산)
function monthBars() {
  const end = new Date(CHECKED), months = [];
  // 최신 달이 맨 앞(왼쪽) — 사이트 전체 "최신이 먼저" 규칙
  for (let i = 0; i < 12; i++) { const d = new Date(end.getFullYear(), end.getMonth() - i, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
  const releases = Object.values(TIMELINES).flat().filter((e) => e.kind === "release");
  const counts = months.map((m) => releases.filter((e) => e.date.startsWith(m)).length);
  const max = Math.max(...counts, 1);
  const label = (m) => `${+m.slice(5)}월`;
  return `<div class="mbars" role="img" aria-label="최근 12개월 월별 모델 출시 수">
    ${counts.map((c, i) => `<span class="mb${i === 0 ? " cur" : ""}" title="${months[i].slice(0, 4)}년 ${label(months[i])} · ${c}개"><i style="height:${c ? Math.max(8, (c / max) * 100) : 0}%"></i></span>`).join("")}
    </div><div class="mbars-x"><span>${label(months[0])} (최신)</span><span>${label(months[11])}</span></div>
    <div class="mbars-cap">월별 출시 수 (7개 회사)</div>`;
}

// ---- LLM 차트 ----
const usd = (v) => (Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`);
const blended = (m) => (m.price.in * 3 + m.price.out) / 4;
const relDate = (d) => { const [, m, day] = d.split("-"); return day ? `${+m}.${+day}` : `${+m}월`; };
let rankKey = "new";
// 최근 30일 안에 나온 모델에 NEW 표시
const isNew = (m) => m.date >= daysAgo(30);
// 인기: OpenRouter 30일 사용량 (POPULAR)
const CO_FAMILY = { openai: "gpt", anthropic: "claude", google: "gemini", deepseek: "deepseek", meta: "llama", mistral: "mistral", xai: "grok" };
const pct = (c) => { const v = c * 100; return `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString("en-US")}%`; };
const fmtTok = (n) => (n >= 1e12 ? `${Math.round(n / 1e12).toLocaleString("en-US")}조` : `${Math.round(n / 1e8).toLocaleString("en-US")}억`);
// 막대 길이(%) — 가장 큰 값 = 100%
const meter = (v, max) => `<span class="meter" aria-hidden="true"><i style="width:${Math.max(1.5, (v / max) * 100)}%"></i></span>`;
function popRows() {
  const max = Math.max(...POPULAR.items.map((t) => t.tokens));
  return POPULAR.items.map((t, i) => `
    <button type="button" class="row row-price" data-pop="${i}">
      <span class="rk">${i + 1}</span>
      ${t.co ? logo(t.co) : `<span class="logo-c" style="--c:#2a2a2e">${esc(t.name[0])}</span>`}
      <span class="nm"><b>${esc(t.name)}${t.change === null ? '<span class="new">NEW</span>' : ""}</b><small>${esc(t.author)}</small>${meter(t.tokens, max)}</span>
      <span class="pr num"><b>${fmtTok(t.tokens)} 토큰</b><small class="${t.change === null ? "flat" : t.change >= 0 ? "up" : "down"}">${t.change === null ? "새로 나옴" : `한 달 전보다 ${pct(t.change)}`}</small></span>
    </button>`).join("");
}
// 차트 아래 설명: 탭마다 무엇을 기준으로 줄 세웠는지, 왜 보는지
const LEGENDS = {
  new: () => `최신순 = 공식 출시일 순서예요. 지금 어떤 AI가 새로 나왔는지 볼 수 있어요 · ${CHECKED} 확인`,
  price: () => priceMode === "api"
    ? `API 요금 = 개발자가 자기 프로그램에서 AI를 불러 쓸 때 내는 돈이에요. 100만 토큰(한글 약 50만~100만 자)당 입력 / 출력 가격, 싼 순서. 막대 = 입력 3 : 출력 1로 섞은 평균 단가 (길수록 비쌈) · ${CHECKED} 확인`
    : `${TIER_LABEL[priceMode]} = 앱·웹에서 AI를 쓰는 개인 구독 월 요금이에요 (미국 기준 USD) · ${CHECKED} 확인`,
  pop: () => `인기 = OpenRouter(여러 회사 AI를 한곳에서 골라 쓰는 개발자 서비스)에서 지난 30일 동안 가장 많이 쓰인 모델이에요. 토큰 = AI가 읽고 쓴 글자 조각 수, 막대 = 1위 대비 사용량 · ${POPULAR.checked}까지 자료`,
};
function setLegend() { $(".a-chart .legend").textContent = LEGENDS[rankKey](); }
// 구독 요금: 서비스별 Pro급 / Max급 월 요금 (SUBSCRIPTIONS)
let priceMode = "api";
const tierOf = (sub, t) => sub.plans.find((p) => p[2] === t);
const money = (v) => (v === 0 ? "무료" : Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`);
const TIER_LABEL = { free: "무료 요금제", pro: "기본 유료 요금제", max: "최상위 유료 요금제" };
function subRows(tier) {
  const planOf = (sub) => (tier === "free" ? sub.plans.find((p) => p[1] === 0) : tierOf(sub, tier));
  const rows = Object.entries(SUBSCRIPTIONS).map(([co, sub]) => ({ co, sub, plan: planOf(sub) }))
    .sort((x, y) => (x.plan ? 0 : 1) - (y.plan ? 0 : 1)
      || (tier === "free" ? (tierOf(x.sub, "pro")?.[1] ?? 0) - (tierOf(y.sub, "pro")?.[1] ?? 0) : (x.plan?.[1] ?? 0) - (y.plan?.[1] ?? 0)));
  let rank = 0;
  return rows.map(({ co, sub, plan }) => `
    <button type="button" class="row row-price${plan ? "" : " row-none"}" data-sub="${co}">
      <span class="rk">${plan ? ++rank : "–"}</span>${logo(co)}
      <span class="nm"><b>${esc(sub.service)}</b><small>${plan ? esc(tier === "free" && sub.free ? `${plan[0]} · ${sub.free}` : plan[0]) : esc(sub.note || "해당 요금제 없음")}</small></span>
      <span class="pr num"><b>${plan ? money(plan[1]) : "없음"}</b><small class="flat">${plan ? (plan[1] ? "월 · 미국 기준" : "무료 요금제") : TIER_LABEL[tier]}</small></span>
    </button>`).join("");
}
function renderRows() {
  $("#pmode").hidden = rankKey !== "price";
  if (rankKey === "pop") { $("#rows").innerHTML = popRows(); return; }
  if (rankKey === "price" && priceMode !== "api") { $("#rows").innerHTML = subRows(priceMode); return; }
  let list = byNewest(MODELS);
  // 요금: 입력 3 : 출력 1 비율로 섞은 평균 단가가 싼 순
  if (rankKey === "price") list.sort((a, b) => blended(a) - blended(b));
  const maxPrice = Math.max(...MODELS.map(blended));
  $("#rows").innerHTML = list.map((m, i) => `
    <button type="button" class="row row-price" data-id="${m.id}">
      <span class="rk">${i + 1}</span>
      ${modelLogo(m)}
      <span class="nm"><b>${esc(m.name)}${isNew(m) ? '<span class="new">NEW</span>' : ""}</b><small>${COMPANIES[m.co].name}</small>${rankKey === "price" ? meter(blended(m), maxPrice) : ""}</span>
      <span class="pr num">${rankKey === "new" ? `<b>${relDate(m.date)}</b><small class="flat">${m.date.slice(0, 4)} 출시</small>` : `<b>${usd(m.price.in)} / ${usd(m.price.out)}</b><small class="flat">입력 / 출력</small>`}</span>
    </button>`).join("");
}
$("#rankTabs").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  rankKey = b.dataset.k;
  setLegend();
  $("#rankTabs").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  renderRows();
});
$("#pmode").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pm]"); if (!b) return;
  priceMode = b.dataset.pm;
  $("#pmode").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  renderRows(); setLegend();
});
$("#rows").addEventListener("click", (e) => {
  const b = e.target.closest(".row"); if (!b) return;
  if (b.dataset.sub) return openFamily(CO_FAMILY[b.dataset.sub]);
  if (b.dataset.pop === undefined) return openModel(b.dataset.id);
  const t = POPULAR.items[+b.dataset.pop];
  if (t.model) openModel(t.model);                            // 목록에 있는 모델
  else if (t.co && CO_FAMILY[t.co]) openFamily(CO_FAMILY[t.co]); // 아는 회사면 계열 화면
});

// ---- 소식 ----
function newsList(filterCo) {
  return NEWS.filter((n) => !filterCo || n.co === filterCo);
}
const newsDate = (d) => { const [y, m, day] = d.split("-"); return `${y}.${+m}.${+day}`; };
function newsHTML(list) {
  return list.length ? list.map((n, i) => `
    <div class="news">
      <button type="button" aria-expanded="false" data-i="${i}">
        ${logo(n.co)}
        <span>
          <span class="t">${esc(n.title)}</span>
          <span class="s" style="display:block">${esc(n.what)}</span>
          <span class="m"><span class="pill ${n.type}">${TYPES[n.type]}</span><span>${COMPANIES[n.co].name}</span><span>${newsDate(n.date)}</span></span>
        </span>
      </button>
      <div class="more" hidden>
        <div class="ai-note"><b>나에게 왜 중요한가요</b>${esc(n.why)}</div>
        <a class="src" href="${n.link || COMPANIES[n.co].url}" target="_blank" rel="noopener">원문 보기 ›</a>
      </div>
    </div>`).join("") : `<p class="empty">아직 소식이 없어요</p>`;
}
// 주요 소식 검색: 제목·요약·회사·카테고리에서 찾음 (띄어쓴 단어는 모두 들어 있어야 함)
function feedMatch(n, toks) {
  const hay = norm([n.title, n.what, n.why, COMPANIES[n.co].name, TYPES[n.type], ...coAliases(n.co)].join(" "));
  return toks.every((t) => hay.includes(t));
}
function renderFeed() {
  const toks = ($("#feedQ")?.value || "").toLowerCase().trim().split(/\s+/).filter(Boolean).map(norm).filter(Boolean);
  const all = newsList();
  const list = toks.length ? all.filter((n) => feedMatch(n, toks)) : all;
  $("#feedCount").textContent = toks.length ? `${list.length} / ${all.length}건` : `${all.length}건`;
  $("#feed").innerHTML = list.length ? newsHTML(list)
    : `<p class="empty">‘${esc($("#feedQ").value.trim())}’에 맞는 소식이 없어요</p>`;
}
$("#feedQ").addEventListener("input", renderFeed);
document.addEventListener("click", (e) => {
  const b = e.target.closest(".news > button"); if (!b) return;
  const more = b.nextElementSibling; more.hidden = !more.hidden; b.setAttribute("aria-expanded", !more.hidden);
});

// ---- 모델 상세 시트 ----
function openSheet(html) { $("#sheet").innerHTML = html; $("#dim").hidden = false; document.body.style.overflow = "hidden"; }
function closeSheet() { $("#dim").hidden = true; document.body.style.overflow = ""; }
$("#dim").addEventListener("click", (e) => { if (e.target.id === "dim" || e.target.closest("[data-close]")) closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

function openModel(id, tab = "info") {
  const m = MODELS.find((x) => x.id === id);
  const state = { tab };
  const draw = () => {
    openSheet(`
      <div class="sh-top">
        ${modelLogo(m, 44)}
        <div class="nm"><b>${esc(m.name)}</b><small>${COMPANIES[m.co].name} · ${esc(m.line)}</small></div>
        <button type="button" class="iconbtn" data-close aria-label="닫기">✕</button>
      </div>
      <div class="stabs">${[["info", "정보·요금"], ["evo", "진화 기록"], ["news", "소식"]].map(([k, l]) =>
        `<button type="button" data-tab="${k}" aria-pressed="${state.tab === k}">${l}</button>`).join("")}</div>
      <div class="pane">${pane(m, state.tab)}</div>`);
    $("#sheet").querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { state.tab = b.dataset.tab; draw(); });
  };
  draw();
}
// 정보 탭: 이 회사 서비스의 구독 요금제 전체
function subHTML(co) {
  const sub = SUBSCRIPTIONS[co]; if (!sub) return "";
  return `<div><h4>앱으로 쓰는 구독 요금 · ${esc(sub.service)}</h4><div class="kv">${sub.plans.map(([n, v, t]) =>
    `<div><span>${esc(n)}${t ? ` <small>${t === "pro" ? "기본 유료" : "최상위 유료"}</small>` : ""}</span><span class="num">${money(v)}${v ? " / 월" : ""}</span></div>`).join("")}</div>
    <p class="price-note">${sub.note ? `${esc(sub.note)} · ` : ""}미국 기준 월 요금 · ${CHECKED} 확인 · <a href="${esc(sub.source)}" target="_blank" rel="noopener">출처 ›</a></p></div>`;
}
function pane(m, tab) {
  if (tab === "evo") return timelineHTML(m.family, m.name);
  if (tab === "news") return `<div class="feed">${newsHTML(newsList(m.co))}</div>`;
  return `
    <div><h4>어디서 쓸 수 있나요</h4><div class="chips">${m.use.map((u) => `<span>${esc(u)}</span>`).join("")}</div></div>
    <div><h4>주요 기능</h4><div class="chips">${m.features.map((u) => `<span>${esc(u)}</span>`).join("")}</div></div>
    <div><h4>API 요금 <small style="font-weight:500;color:var(--sub)">· 개발자가 프로그램에서 쓸 때</small></h4><div class="kv">
      <div><span>입력 (100만 토큰)</span><span class="num">${usd(m.price.in)}</span></div>
      <div><span>출력 (100만 토큰)</span><span class="num">${usd(m.price.out)}</span></div></div>
      <p class="price-note">${m.price.note ? `${esc(m.price.note)} · ` : ""}토큰 = AI가 글을 읽고 쓰는 단위 (한글 1~2자 정도) · ${CHECKED} 확인 · <a href="${esc(m.price.source)}" target="_blank" rel="noopener">출처 ›</a></p></div>
    ${peerPriceHTML(m)}
    ${subHTML(m.co)}`;
}
// 같은 회사 모델끼리 API 평균 단가 비교 (입력 3 : 출력 1)
function peerPriceHTML(m) {
  const peers = MODELS.filter((x) => x.co === m.co).sort((a, b) => blended(a) - blended(b));
  if (peers.length < 2) return "";
  const max = Math.max(...peers.map(blended));
  return `<div><h4>${COMPANIES[m.co].name} 모델끼리 요금 비교</h4><div class="peers">${peers.map((x) => `
    <div class="peer${x.id === m.id ? " cur" : ""}"><span class="pn">${esc(x.name)}</span>${meter(blended(x), max)}<span class="pv num">${usd(x.price.in)} / ${usd(x.price.out)}</span></div>`).join("")}</div>
    <p class="price-note">막대 = 입력 3 : 출력 1로 섞은 평균 단가 · 길수록 비싸요 · 지금 보는 모델은 밝게 표시</p></div>`;
}

// ---- AI 진화 타임라인 (실제 데이터) ----
let tlOrder = "new";                       // new: 최신부터(기본) · old: 처음부터
const KIND = { release: "출시", update: "업데이트", deprecation: "종료" };
const fmtDate = (e) => { const [, m, d] = e.date.split("-"); return e.precision === "month" ? `${+m}월` : `${+m}.${+d}`; };
// "DeepSeek-V4-Pro 정식"처럼 뒤에 한글 설명이 붙은 항목도 같은 모델로 봄
const sameModel = (entryName, modelName) => entryName.split(" · ").some((n) => {
  const a = norm(n), b = norm(modelName);
  return a === b || (a.startsWith(b) && /^[^a-z0-9]/.test(a.slice(b.length)));
});
function timelineHTML(key, hl = "") {
  const list = [...(TIMELINES[key] || [])];
  if (!list.length) return `<p class="empty">아직 타임라인 데이터가 없어요</p>`;
  const first = list[0].date.slice(0, 4), last = list[list.length - 1].date.slice(0, 4);
  if (tlOrder === "new") list.reverse();
  let year = "";
  const rows = list.map((e) => {
    const y = e.date.slice(0, 4);
    const head = y !== year ? `<div class="tl-year num">${(year = y)}</div>` : "";
    const cur = hl && sameModel(e.name, hl);
    return `${head}<div class="tl-item ${e.kind}${cur ? " cur" : ""}"><i class="tl-dot"></i><div class="tl-body">
      <div class="tl-meta"><span class="num">${fmtDate(e)}</span><span class="tl-kind">${KIND[e.kind]}</span>${cur ? `<span class="tl-now">지금 보는 모델</span>` : ""}</div>
      <b>${esc(e.name)}</b><p>${esc(e.summary)}</p>
      ${e.specs.length ? `<div class="chips">${e.specs.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
      <a class="tl-src" href="${esc(e.source)}" target="_blank" rel="noopener">출처 ›</a></div></div>`;
  }).join("");
  return `<div class="tl" data-fam="${key}" data-hl="${esc(hl)}">
    <div class="tl-top"><span class="real">실제 데이터</span><span class="tl-cnt">${first}–${last} · ${list.length}개</span>
      <span class="tl-order" role="group" aria-label="정렬">${[["new", "최신부터"], ["old", "처음부터"]].map(([k, l]) =>
        `<button type="button" data-tlorder="${k}" aria-pressed="${tlOrder === k}">${l}</button>`).join("")}</span></div>
    <p class="tl-help">용어 풀이 · 파라미터 = AI 모델의 크기 · 컨텍스트 = 한 번에 읽을 수 있는 글의 양 · 오픈 웨이트 = 모델 파일을 내려받아 직접 쓸 수 있음 · 멀티모달 = 글·그림·소리를 함께 이해함</p>
    <div class="tl-list">${rows}</div>
    <p class="tl-foot">${TIMELINE_CHECKED} 기준 · 각 회사 공식 발표 기반 · <i class="k release"></i>출시 <i class="k update"></i>업데이트 <i class="k deprecation"></i>종료</p>
  </div>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-tlorder]"); if (!b) return;
  tlOrder = b.dataset.tlorder;
  const box = b.closest(".tl");
  box.outerHTML = timelineHTML(box.dataset.fam, box.dataset.hl);
});

// 계열 종합 화면: 지금 라인업 → 차트 모델 → 진화 타임라인 → 관련 소식 → 기능
function openFamily(key) {
  const f = FAMILIES[key];
  const models = byNewest(MODELS.filter((m) => m.family === key));
  const feats = Object.entries(SEARCH).flatMap(([k, rs]) => rs.filter((r) => r.co === f.co).map((r) => ({ ...r, k })));
  const news = newsList(f.co);
  openSheet(`
    <div class="sh-top">${logo(f.co, 44)}
      <div class="nm"><b>${esc(f.name)}</b><small>${COMPANIES[f.co].name} · 한눈에 보기</small></div>
      <button type="button" class="iconbtn" data-close aria-label="닫기">✕</button></div>
    <div class="fam">
      <section class="fam-now"><h4>지금 쓸 수 있는 모델</h4><p>${esc(f.now)}</p><small>${TIMELINE_CHECKED} 기준</small></section>
      ${models.length ? `<section><h4>순위표에 있는 모델</h4>${models.map((m) => `
        <button type="button" class="mres" data-m="${m.id}">${modelLogo(m)}
          <span><b>${esc(m.name)}</b><p>${esc(m.line)}</p></span><span class="go">자세히 ›</span></button>`).join("")}</section>` : ""}
      <section><h4>진화 타임라인</h4>${timelineHTML(key)}</section>
      ${news.length ? `<section><h4>관련 소식</h4><div class="feed">${newsHTML(news)}</div></section>` : ""}
      ${feats.length ? `<section><h4>이 회사에서 쓸 수 있는 기능</h4>${feats.map((r) => `
        <div class="res">${logo(r.co)}<div><b>${esc(r.feat)}</b><p>${esc(r.what)} · ${esc(r.plan)}</p></div></div>`).join("")}</section>` : ""}
    </div>`);
  $("#sheet").querySelectorAll("[data-m]").forEach((b) => b.onclick = () => openModel(b.dataset.m));
}

// 모델 목록은 출시일 최신순
const byNewest = (list) => [...list].sort((a, b) => b.date.localeCompare(a.date));

// ---- AI 검색 ----
function norm(t) { return t.toLowerCase().replace(/[\s\-_.]/g, ""); }
const GENERIC = ["기능", "모델", "버전", "타임라인", "역사", "진화", "소식", "ai"];
// "gpt", "클로드", "gpt 기능"처럼 계열 자체를 찾는 검색
function familyExact(n) {
  return Object.keys(FAMILIES).find((k) => FAMILIES[k].aliases.map(norm).some((w) =>
    w === n || (n.length >= 2 && w.startsWith(n)) || GENERIC.some((g) => n === w + g)));
}
// "gpt-4o 가격"처럼 계열 이름이 포함된 검색
function familyLoose(n) {
  return Object.keys(FAMILIES).find((k) => FAMILIES[k].aliases.map(norm).some((w) => n.includes(w)));
}
// 차트에 있는 특정 모델 찾기 ("gpt-5", "소네트")
function findModels(q) {
  const n = norm(q);
  return MODELS.filter((m) => {
    const words = [m.name, ...(MODEL_ALIASES[m.id] || [])].map(norm);
    return words.some((w) => w.includes(n) || n.includes(w));
  });
}
function runSearch(q) {
  q = q.trim(); if (!q) return;
  const n = norm(q);
  const exact = familyExact(n);
  if (exact) return openFamily(exact);
  const models = byNewest(findModels(q));
  if (models.length === 1) return openModel(models[0].id, "info");
  if (!models.length) { const loose = familyLoose(n); if (loose) return openFamily(loose); }
  const key = Object.keys(SEARCH).find((k) => q.includes(k) || k.includes(q));
  const chips = `<div class="qchips">${["GPT", "Claude", "Gemini", "딥시크", "Grok", ...Object.keys(SEARCH)].map((k) => `<button type="button" data-q="${k}">${k}</button>`).join("")}</div>`;
  let title, body;
  if (models.length) {
    title = `‘${esc(q)}’ 모델 ${models.length}개`;
    body = models.map((m) => `
      <button type="button" class="mres" data-m="${m.id}">${modelLogo(m)}
        <span><b>${esc(m.name)}</b><p>${COMPANIES[m.co].name} · ${esc(m.line)}</p>
        <span class="chips">${m.features.map((f) => `<span>${esc(f)}</span>`).join("")}</span></span>
        <span class="go">기능 보기 ›</span>
      </button>`).join("");
  } else if (key) {
    title = `‘${esc(key)}’ 기능이 있는 곳 ${SEARCH[key].length}곳`;
    body = SEARCH[key].map((r) => `
      <div class="res">${logo(r.co)}
        <div><b>${esc(r.feat)}</b><p>${COMPANIES[r.co].name} · ${esc(r.plan)}</p>
        <div class="ex">${esc(r.what)}</div></div>
      </div>`).join("");
  } else {
    title = `‘${esc(q)}’ 검색 결과`;
    body = `<p style="color:var(--sub)">찾는 결과가 없어요. AI 이름(GPT, 클로드, 제미나이…)이나 아래 단어로 검색해 보세요.</p>`;
  }
  openSheet(`
    <div class="sh-top"><div class="nm"><b>${title}</b><small>${models.length ? "눌러서 기능 한눈에 보기" : "회사 · 요금제 · 무엇을 하나요"}</small></div>
    <button type="button" class="iconbtn" data-close aria-label="닫기">✕</button></div>
    <div style="margin-top:8px">${body}</div>${chips}`);
  $("#sheet").querySelectorAll("[data-q]").forEach((b) => b.onclick = () => runSearch(b.dataset.q));
  $("#sheet").querySelectorAll("[data-m]").forEach((b) => b.onclick = () => openModel(b.dataset.m, "info"));
}
// ---- 검색 자동완성: 누르면 모델 목록, 치면 단어별로 좁혀짐 ("gp" → GPT, "cla op" → Claude Opus) ----
const sugBox = $("#suggest"), qInput = $("#q");
let sugItems = [], sugActive = -1;
const wordsOf = (...names) => names.flatMap((n) => [norm(n), ...n.toLowerCase().split(/[\s\-·/]+/).map(norm)]).filter(Boolean);
// 모든 단어(토큰)가 어떤 단어의 앞부분과 맞으면 통과
const matches = (words, toks) => toks.every((t) => words.some((w) => w.startsWith(t)));
const familyNewest = (k) => (TIMELINES[k] || []).at(-1)?.date || "";
function suggestList(q) {
  const toks = q.toLowerCase().trim().split(/\s+/).filter(Boolean).map(norm).filter(Boolean);
  const items = [];
  const famKeys = Object.keys(FAMILIES).sort((a, b) => familyNewest(b).localeCompare(familyNewest(a)));
  for (const k of famKeys) {
    const f = FAMILIES[k];
    const famWords = wordsOf(f.name, ...f.aliases);
    const famHit = !toks.length || matches(famWords, toks);
    const models = byNewest(MODELS.filter((m) => m.family === k)).filter((m) =>
      famHit || matches(wordsOf(m.name, COMPANIES[m.co].name, ...(MODEL_ALIASES[m.id] || []), ...f.aliases), toks));
    if (!famHit && !models.length) continue;
    items.push({ type: "fam", key: k, label: f.name, sub: `${COMPANIES[f.co].name} · 계열 전체 · 진화 타임라인` });
    models.forEach((m) => items.push({ type: "model", id: m.id, label: m.name, sub: `${COMPANIES[m.co].name} · ${m.date.replaceAll("-", ".")} 출시` }));
  }
  if (toks.length) {
    Object.keys(SEARCH).filter((k) => matches(wordsOf(k), toks) || norm(k).includes(toks.join("")))
      .forEach((k) => items.push({ type: "feat", key: k, label: k, sub: `이 기능이 있는 곳 ${SEARCH[k].length}곳` }));
    items.push({ type: "all", label: `‘${q.trim()}’ 전체 검색`, sub: "모델·기능 모두에서 찾기" });
  }
  return { items, toks };
}
// 입력한 글자와 맞는 앞부분을 강조
function hl(label, toks) {
  let out = esc(label);
  for (const t of toks) {
    const re = new RegExp(`(^|[\\s\\-·(])(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i");
    out = out.replace(re, "$1<mark>$2</mark>");
  }
  return out;
}
// 주요 소식과 같은 카테고리 탭: 출시 기록(출시→모델 출시, 업데이트→기능, 종료→지원 종료) + 주요 소식
let sugTab = "all";
const KIND_TYPE = { release: "model", update: "feature", deprecation: "dep" };
const coAliases = (co) => Object.values(FAMILIES).filter((f) => f.co === co).flatMap((f) => f.aliases);
function newsItems(tab, toks) {
  const real = Object.entries(TIMELINES).flatMap(([fam, list]) => list.map((e) => ({ ...e, fam })))
    .filter((e) => KIND_TYPE[e.kind] === tab)
    .filter((e) => !toks.length || matches(wordsOf(e.name, COMPANIES[FAMILIES[e.fam].co].name, ...FAMILIES[e.fam].aliases), toks))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, toks.length ? 50 : 20)
    .map((e) => ({ type: "tl", e, label: e.name, co: FAMILIES[e.fam].co, when: `${e.date.slice(0, 4)}.${fmtDate(e)}`, ntype: tab }));
  const ex = NEWS.map((n, i) => ({ n, i })).filter(({ n }) => n.type === tab)
    .filter(({ n }) => !toks.length || matches(wordsOf(n.title, COMPANIES[n.co].name, ...coAliases(n.co)), toks))
    .map(({ n, i }) => ({ type: "news", i, label: n.title, co: n.co, when: newsDate(n.date), ntype: tab }));
  return { real, ex };
}
function renderSuggest() {
  const toks = qInput.value.toLowerCase().trim().split(/\s+/).filter(Boolean).map(norm).filter(Boolean);
  const tabs = [["all", "전체"], ...Object.entries(TYPES)];
  const count = (k) => { const { real, ex } = newsItems(k, toks); return real.length + ex.length; };
  const tabsHTML = `<div class="sg-tabs" role="tablist" aria-label="소식 종류">${tabs.map(([k, l]) =>
    `<button type="button" role="tab" data-tab="${k}" aria-selected="${sugTab === k}">${l}${toks.length && k !== "all" ? ` <em>${count(k)}</em>` : ""}</button>`).join("")}</div>`;
  let body = "";
  if (sugTab === "all") {
    sugItems = suggestList(qInput.value).items;
    const icon = (it) => it.type === "fam" ? logo(FAMILIES[it.key].co, 28)
      : it.type === "model" ? modelLogo(MODELS.find((m) => m.id === it.id), 28)
      : `<span class="sg-ic">${it.type === "feat" ? "⚡" : "⌕"}</span>`;
    body = (toks.length ? "" : `<div class="sg-head">AI 계열과 모델 · 최신순</div>`) + sugItems.map((it, i) => `
      <button type="button" role="option" id="sg-${i}" class="sg-item sg-${it.type}" data-i="${i}" aria-selected="false">
        ${icon(it)}<span class="sg-txt"><b>${hl(it.label, toks)}</b><small>${esc(it.sub)}</small></span>
        ${it.type === "fam" ? `<span class="sg-go">전체 ›</span>` : ""}
      </button>`).join("");
  } else {
    const { real, ex } = newsItems(sugTab, toks);
    sugItems = [...real, ...ex];
    const row = (it, i) => `
      <button type="button" role="option" id="sg-${i}" class="sg-item sg-news" data-i="${i}" aria-selected="false">
        ${logo(it.co, 28)}<span class="sg-txt"><b>${hl(it.label, toks)}</b>
        <small><span class="pill ${it.ntype}">${TYPES[it.ntype]}</span> ${COMPANIES[it.co].name} · ${esc(it.when)}</small></span>
      </button>`;
    body = (real.length ? `<div class="sg-head">출시 기록 <span class="real">실제 데이터</span>${toks.length ? "" : " · 최신 20개"}</div>` + real.map(row).join("") : "")
      + (ex.length ? `<div class="sg-head">주요 소식</div>` + ex.map((it, j) => row(it, real.length + j)).join("") : "")
      + (sugItems.length ? "" : `<p class="sg-empty">‘${esc(TYPES[sugTab])}’에 맞는 소식이 없어요</p>`);
  }
  sugActive = -1;
  sugBox.innerHTML = tabsHTML + `<div class="sg-body">${body}</div>`;
  sugBox.hidden = false; qInput.setAttribute("aria-expanded", "true");
}
// 주요 소식에서 해당 소식을 펼쳐 보여줌
function showNews(i) {
  if ($("#feedQ").value) { $("#feedQ").value = ""; renderFeed(); } // 전체 목록 기준 위치로 찾기
  const el = $("#feed").children[i]; if (!el) return;
  const btn = el.querySelector(":scope > button");
  if (btn && btn.nextElementSibling.hidden) btn.click();
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600);
}
function closeSuggest() { sugBox.hidden = true; qInput.setAttribute("aria-expanded", "false"); qInput.removeAttribute("aria-activedescendant"); sugActive = -1; }
function moveSuggest(d) {
  if (sugBox.hidden || !sugItems.length) return;
  sugActive = (sugActive + d + sugItems.length) % sugItems.length;
  sugBox.querySelectorAll(".sg-item").forEach((b, i) => b.setAttribute("aria-selected", i === sugActive));
  const cur = $(`#sg-${sugActive}`); cur.scrollIntoView({ block: "nearest" });
  qInput.setAttribute("aria-activedescendant", cur.id);
}
function pickSuggest(it) {
  closeSuggest(); qInput.blur();
  if (it.type === "fam") { qInput.value = it.label; openFamily(it.key); }
  else if (it.type === "model") { qInput.value = it.label; openModel(it.id); }
  else if (it.type === "feat") { qInput.value = it.label; runSearch(it.key); }
  else if (it.type === "tl") {
    const m = MODELS.find((x) => x.family === it.e.fam && sameModel(it.e.name, x.name));
    m ? openModel(m.id, "evo") : openFamily(it.e.fam);
  }
  else if (it.type === "news") showNews(it.i);
  else runSearch(qInput.value);
}
qInput.addEventListener("focus", renderSuggest);
qInput.addEventListener("click", renderSuggest);
qInput.addEventListener("input", renderSuggest);
qInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); if (sugBox.hidden) renderSuggest(); moveSuggest(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moveSuggest(-1); }
  else if (e.key === "Escape" && !sugBox.hidden) { e.stopPropagation(); closeSuggest(); }
});
sugBox.addEventListener("mousedown", (e) => e.preventDefault()); // 누르는 동안 입력창 포커스 유지
sugBox.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab]");
  if (t) { e.stopPropagation(); sugTab = t.dataset.tab; renderSuggest(); return; } // 다시 그려져도 "바깥 클릭"으로 닫히지 않게
  const b = e.target.closest(".sg-item"); if (b) pickSuggest(sugItems[+b.dataset.i]);
});
document.addEventListener("click", (e) => { if (!e.target.closest("#searchForm")) closeSuggest(); });
$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!sugBox.hidden && sugActive >= 0) return pickSuggest(sugItems[sugActive]);
  closeSuggest(); runSearch(qInput.value || "코드 리뷰"); qInput.blur();
});

// ---- 알림 ----
let tt;
function toast(co, title, body) {
  const t = $("#toast");
  t.innerHTML = `${logo(co)}<div><b>${esc(title)}</b><p>${esc(body)}</p></div>`;
  t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 3500);
}
// 알림함: 실제 타임라인(TIMELINES) 기준 최근 30일 출시·업데이트·종료 소식
const NOTI_DAYS = 30;
const SEEN_KEY = "curator.notiSeen";   // 마지막으로 확인한 소식 날짜 (이 브라우저에만 저장)
const getSeen = () => { try { return localStorage.getItem(SEEN_KEY) || ""; } catch { return ""; } };
const setSeen = (d) => { try { localStorage.setItem(SEEN_KEY, d); } catch { /* 저장 불가 환경은 무시 */ } };
function recentNews() {
  const since = new Date(TIMELINE_CHECKED); since.setDate(since.getDate() - NOTI_DAYS);
  const s = since.toISOString().slice(0, 10);
  return Object.entries(TIMELINES).flatMap(([fam, list]) => list.filter((e) => e.date >= s).map((e) => ({ ...e, fam })))
    .sort((a, b) => b.date.localeCompare(a.date));
}
function updateBell() {
  const seen = getSeen();
  const n = recentNews().filter((e) => e.date > seen).length;
  $("#bellCount").textContent = n ? (n > 9 ? "9+" : n) : "";
  $("#bell").setAttribute("aria-label", n ? `알림, 새 소식 ${n}개` : "알림");
}
function openNoti() {
  const list = recentNews(), seen = getSeen();
  const box = $("#noti");
  box.innerHTML = `
    <div class="nt-head"><b>새 소식</b><span class="real">실제 데이터</span><small>최근 ${NOTI_DAYS}일 · ${TIMELINE_CHECKED} 기준</small></div>
    <div class="nt-list">${list.length ? list.map((e, i) => {
      const f = FAMILIES[e.fam];
      return `<button type="button" class="nt-item ${e.kind}${e.date > seen ? " unread" : ""}" data-n="${i}">
        ${logo(f.co, 36)}
        <span class="nt-txt">
          <span class="nt-meta">${e.date > seen ? `<em>NEW</em>` : ""}<span>${KIND[e.kind]}</span><span>${COMPANIES[f.co].name}</span><span class="num">${fmtDate(e)}</span></span>
          <b>${esc(e.name)}</b><small>${esc(e.summary)}</small>
        </span></button>`;
    }).join("") : `<p class="empty">최근 ${NOTI_DAYS}일 동안 새 소식이 없어요</p>`}</div>`;
  box.querySelectorAll("[data-n]").forEach((b) => b.onclick = () => {
    const e = list[+b.dataset.n];
    closeNoti();
    const m = MODELS.find((x) => x.family === e.fam && sameModel(e.name, x.name));
    m ? openModel(m.id, "evo") : openFamily(e.fam);
  });
  box.hidden = false; $("#bell").setAttribute("aria-expanded", "true");
  if (list.length) setSeen(list[0].date);   // 열어 본 소식은 읽음 처리
  updateBell();
}
function closeNoti() { $("#noti").hidden = true; $("#bell").setAttribute("aria-expanded", "false"); }
$("#bell").addEventListener("click", (e) => { e.stopPropagation(); $("#noti").hidden ? openNoti() : closeNoti(); });
document.addEventListener("click", (e) => { if (!e.target.closest("#noti, #bell")) closeNoti(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNoti(); });

// 처음 그리기
renderIdx(); renderRows(); setLegend(); renderFeed(); updateBell();
$("#chartTime").textContent = `${CHECKED} 확인`;
