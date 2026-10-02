/* =========================================================
   화면 코드
   ========================================================= */
const $ = (s) => document.querySelector(s);

// AI ARCHIVE 링크: npm run dev 로 띄운 경우(localhost)는 로컬 AI ARCHIVE(localhost:3000), 그 밖(배포·파일 더블클릭)은 배포된 주소
const ARCHIVE_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:3000/" : "https://ai-archive-weld.vercel.app/";
document.querySelectorAll("a.to-archive").forEach((a) => (a.href = ARCHIVE_URL));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cls = (v) => (v > 0 ? "up" : v < 0 ? "down" : "flat");
const sign = (v) => (v > 0 ? "+" : "") + v.toFixed(1) + "%";
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
const fav = new Set(["opus55", "g38flash"]);

// 가짜 차트 데이터: seed로 늘 같은 모양, 끝값은 등락률 방향에 맞춤
function series(seed, n, chg) {
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const out = [100]; for (let i = 1; i < n; i++) out.push(out[i - 1] + (rnd() - 0.5) * 4);
  out.push(out[n - 1] * (1 + chg / 100)); return out;
}
function spark(data, w, h, color, area) {
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / r) * (h - 4)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const id = "g" + Math.random().toString(36).slice(2, 7);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${area ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L${w} ${h} L0 ${h} Z" fill="url(#${id})"/>` : ""}
    <path d="${d}" fill="none" stroke="${color}" stroke-width="${area ? 2 : 1.6}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    ${area ? `<circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="4" fill="${color}"/>` : ""}
  </svg>`;
}
const colorOf = (v) => (v >= 0 ? "#FF4D6D" : "#4D9BFF");

// ---- 오늘의 AI 시장 (지수 카드) ----
function renderIdx() {
  const avg = MODELS.reduce((a, m) => a + m.score, 0) / MODELS.length;
  const avgChg = MODELS.reduce((a, m) => a + m.chg, 0) / MODELS.length;
  const items = [
    { k: "AI 화제성 지수", v: avg.toFixed(1), d: avgChg, seed: 5 },
    { k: "API 평균 단가", v: "지수 94.2", d: -4.1, seed: 9 },
    { k: "오늘 새 소식", v: NEWS.filter((n) => /분 전|시간 전/.test(n.time)).length + "건", d: null, sub: "어제보다 1건 많아요" },
    { k: "지원 종료 예정", v: NEWS.filter((n) => n.type === "dep").length + "건", d: null, sub: "확인이 필요해요", warn: true },
  ];
  $("#idx").innerHTML = items.map((it) => `
    <div class="ix">
      <span class="k">${it.k}</span>
      <span class="v num">${it.v}</span>
      ${it.d !== null ? `<span class="d num ${cls(it.d)}">${sign(it.d)}</span>${spark(series(it.seed, 24, it.d), 120, 28, colorOf(it.d))}`
        : `<span class="d" style="color:${it.warn ? "var(--up)" : "var(--sub)"}">${it.sub}</span>`}
    </div>`).join("");
}

// ---- LLM 차트 ----
const usd = (v) => (Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`);
const blended = (m) => (m.price.in * 3 + m.price.out) / 4;
const relDate = (d) => { const [, m, day] = d.split("-"); return day ? `${+m}.${+day}` : `${+m}월`; };
let rankKey = "new";
// 급상승: 실제 OpenRouter 사용량 증가 (TRENDING)
const CO_FAMILY = { openai: "gpt", anthropic: "claude", google: "gemini", deepseek: "deepseek", meta: "llama", mistral: "mistral", xai: "grok" };
const pct = (c) => { const v = c * 100; return `+${v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1)}%`; };
const fmtTok = (n) => (n >= 1e12 ? `${(n / 1e12).toFixed(1)}조` : `${Math.round(n / 1e8).toLocaleString("en-US")}억`);
function trendRows() {
  return TRENDING.items.map((t, i) => `
    <button type="button" class="row row-price" data-trend="${i}">
      <span class="rk">${i + 1}</span>
      ${t.co ? logo(t.co) : `<span class="logo-c" style="--c:#2a2a2e">${esc(t.name[0])}</span>`}
      <span class="nm"><b>${esc(t.name)}${t.change === null ? '<span class="new">NEW</span>' : ""}</b><small>${esc(t.author)}</small></span>
      <span class="pr num"><b class="up">${t.change === null ? "신규" : pct(t.change)}</b><small class="flat">주간 ${fmtTok(t.tokens)} 토큰</small></span>
    </button>`).join("");
}
// 차트 아래 설명: 탭마다 무엇을 기준으로 줄 세웠는지
const LEGENDS = {
  new: () => "최신 = 공식 출시일 순 · 2026-09-30 기준 실제 데이터",
  hot: () => "화제성 점수 = 공식 발표 수·개발자 커뮤니티 언급량을 합친 지수 (예시)",
  price: () => priceMode === "api"
    ? "요금 = 각 회사 API 표준 요금 (USD · 100만 토큰당 입력 / 출력) · 2026-09-30 기준 실제 데이터"
    : `${TIER_LABEL[priceMode]} 구독 = 각 서비스 개인 요금제 월 요금 (미국 기준 USD) · 2026-09-30 기준 실제 데이터`,
  up: () => `급상승 = OpenRouter 주간 사용량 상위 20개 모델 중 지난주보다 사용량이 늘어난 모델 (지난 7일 vs 그 전 7일) · ${TRENDING.checked} 기준 실제 데이터`,
  fav: () => "관심 = ♥ 표시한 모델",
};
function setLegend() { $(".a-chart .legend").textContent = LEGENDS[rankKey](); }
// 구독 요금: 서비스별 Pro급 / Max급 월 요금 (SUBSCRIPTIONS)
let priceMode = "api";
const tierOf = (sub, t) => sub.plans.find((p) => p[2] === t);
const money = (v) => (v === 0 ? "무료" : Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`);
const TIER_LABEL = { free: "무료", pro: "Pro급", max: "Max급(최상위)" };
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
  if (rankKey === "up") { $("#rows").innerHTML = trendRows(); return; }
  if (rankKey === "price" && priceMode !== "api") { $("#rows").innerHTML = subRows(priceMode); return; }
  let list = [...MODELS];
  if (rankKey === "new") list = byNewest(list);
  if (rankKey === "hot") list.sort((a, b) => b.score - a.score);
  // 요금: 입력 3 : 출력 1 비율로 섞은 평균 단가가 싼 순
  if (rankKey === "price") list.sort((a, b) => blended(a) - blended(b));
  if (rankKey === "fav") list = list.filter((m) => fav.has(m.id));
  $("#rows").innerHTML = list.length ? list.map((m, i) => `
    <button type="button" class="row${rankKey === "price" ? " row-price" : ""}" data-id="${m.id}">
      <span class="rk">${i + 1}</span>
      ${modelLogo(m)}
      <span class="nm"><b>${esc(m.name)}${m.isNew ? '<span class="new">NEW</span>' : ""}</b><small>${COMPANIES[m.co].name}</small></span>
      ${rankKey === "price" ? "" : spark(series(m.seed, 20, m.chg), 64, 26, colorOf(m.chg))}
      <span class="pr num">${rankKey === "new" ? `<b>${relDate(m.date)}</b><small class="flat">${m.date.slice(0, 4)} 출시</small>` : rankKey === "price" ? `<b>${usd(m.price.in)} / ${usd(m.price.out)}</b><small class="flat">입력 / 출력</small>` : `<b>${m.score.toFixed(1)}</b><small class="${cls(m.chg)}">${sign(m.chg)}</small>`}</span>
    </button>`).join("") : `<p class="empty">♥ 눌러서 관심 LLM을 담아 보세요</p>`;
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
  if (b.dataset.trend === undefined) return openModel(b.dataset.id, "evo");
  const t = TRENDING.items[+b.dataset.trend];
  if (t.model) openModel(t.model, "evo");                    // 차트에 있는 모델
  else if (t.co && CO_FAMILY[t.co]) openFamily(CO_FAMILY[t.co]); // 아는 회사면 계열 화면
  else window.open(t.url, "_blank", "noopener");             // 그 밖은 OpenRouter 모델 페이지
});

// ---- 소식 ----
function newsList(filterCo) {
  return NEWS.filter((n) => !filterCo || n.co === filterCo);
}
function newsHTML(list) {
  return list.length ? list.map((n, i) => `
    <div class="news">
      <button type="button" aria-expanded="false" data-i="${i}">
        ${logo(n.co)}
        <span>
          <span class="t">${esc(n.title)}</span>
          <span class="s" style="display:block">${esc(n.summary)}</span>
          <span class="m"><span class="pill ${n.type}">${TYPES[n.type]}</span><span>${COMPANIES[n.co].name}</span><span>${n.time}</span></span>
        </span>
      </button>
      <div class="more" hidden>
        <div class="ai-note"><b>AI 코멘트</b>${esc(n.comment)}</div>
        <a class="src" href="${n.link || COMPANIES[n.co].url}" target="_blank" rel="noopener">공식 원문 보기 ›</a>
      </div>
    </div>`).join("") : `<p class="empty">아직 소식이 없어요</p>`;
}
// 주요 소식 검색: 제목·요약·회사·카테고리에서 찾음 (띄어쓴 단어는 모두 들어 있어야 함)
function feedMatch(n, toks) {
  const hay = norm([n.title, n.summary, COMPANIES[n.co].name, TYPES[n.type], ...coAliases(n.co)].join(" "));
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

const PERIODS = [["1주", 7], ["1달", 30], ["3달", 90], ["1년", 180]];
function openModel(id, tab = "news") {
  const m = MODELS.find((x) => x.id === id);
  const state = { period: 1, tab };
  const draw = () => {
    const [pl, pn] = PERIODS[state.period];
    const chg = m.chg * (state.period + 1) * 1.7;
    openSheet(`
      <div class="sh-top">
        ${modelLogo(m, 44)}
        <div class="nm"><b>${esc(m.name)}</b><small>${COMPANIES[m.co].name} · ${esc(m.line)}</small></div>
        <button type="button" class="iconbtn" data-fav aria-pressed="${fav.has(m.id)}" aria-label="관심 LLM">${fav.has(m.id) ? "♥" : "♡"}</button>
        <button type="button" class="iconbtn" data-close aria-label="닫기">✕</button>
      </div>
      <div class="big">
        <div class="k">화제성 점수 <span class="ex-tag">예시</span></div>
        <div class="v num">${m.score.toFixed(1)}</div>
        <div class="d num ${cls(chg)}">${pl} ${sign(chg)}</div>
      </div>
      <div class="chart">${spark(series(m.seed + state.period, pn / 3 + 12, chg), 500, 170, colorOf(chg), true)}</div>
      <div class="period">${PERIODS.map(([l], i) => `<button type="button" data-per="${i}" aria-pressed="${i === state.period}">${l}</button>`).join("")}</div>
      <div class="stabs">${[["evo", "진화"], ["news", "소식"], ["info", "정보"], ["works", "작업물"]].map(([k, l]) =>
        `<button type="button" data-tab="${k}" aria-pressed="${state.tab === k}">${l}</button>`).join("")}</div>
      <div class="pane">${pane(m, state.tab)}</div>
      <button type="button" class="cta" data-alert>이 모델 소식 알림 받기</button>`);
    const sh = $("#sheet");
    sh.querySelectorAll("[data-per]").forEach((b) => b.onclick = () => { state.period = +b.dataset.per; draw(); });
    sh.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { state.tab = b.dataset.tab; draw(); });
    sh.querySelector("[data-fav]").onclick = () => { fav.has(m.id) ? fav.delete(m.id) : fav.add(m.id); draw(); renderRows(); };
    sh.querySelector("[data-alert]").onclick = () => toast(m.co, `${m.name} 알림을 켰어요`, "새 소식이 올라오면 바로 알려 드릴게요");
  };
  draw();
}
// 정보 탭: 이 회사 서비스의 구독 요금제 전체
function subHTML(co) {
  const sub = SUBSCRIPTIONS[co]; if (!sub) return "";
  return `<div><h4>구독 요금 · ${esc(sub.service)} <span class="real">실제 데이터</span></h4><div class="kv">${sub.plans.map(([n, v, t]) =>
    `<div><span>${esc(n)}${t ? ` <small>${t === "pro" ? "Pro급" : "Max급"}</small>` : ""}</span><span class="num">${money(v)}${v ? " / 월" : ""}</span></div>`).join("")}</div>
    <p class="price-note">${sub.note ? `${esc(sub.note)} · ` : ""}미국 기준 월 요금 · 2026-09-30 확인 · <a href="${esc(sub.source)}" target="_blank" rel="noopener">출처 ›</a></p></div>`;
}
// "입력 8K · 출력 1K" 같은 예시 작업을 실제 요금으로 계산
function taskCost(m, v) {
  const [inK, outK] = (v.match(/[\d.]+/g) || [0, 0]).map(Number);
  const c = (inK * 1000 * m.price.in + outK * 1000 * m.price.out) / 1e6;
  return c < 0.01 ? `$${c.toFixed(4)}` : `$${c.toFixed(3)}`;
}
function pane(m, tab) {
  if (tab === "evo") return timelineHTML(m.family, m.name);
  if (tab === "news") return `<div class="feed">${newsHTML(newsList(m.co))}</div>`;
  if (tab === "info") return `
    <div><h4>어떻게 쓸 수 있나요 <span class="real">실제 데이터</span></h4><div class="chips">${m.use.map((u) => `<span>${esc(u)}</span>`).join("")}</div></div>
    <div><h4>주요 기능 <span class="real">실제 데이터</span></h4><div class="chips">${m.features.map((u) => `<span>${esc(u)}</span>`).join("")}</div></div>
    <div><h4>어떤 작업에 강한가요 <span class="ex-tag">예시</span></h4>${m.strengths.map(([k, v]) =>
      `<div class="bar"><span>${k}</span><i><u style="width:${v}%"></u></i><em class="num">${v || "–"}</em></div>`).join("")}</div>
    <div><h4>API 요금 <span class="real">실제 데이터</span></h4><div class="kv">
      <div><span>입력 (100만 토큰)</span><span class="num">${usd(m.price.in)}</span></div>
      <div><span>출력 (100만 토큰)</span><span class="num">${usd(m.price.out)}</span></div></div>
      <p class="price-note">${m.price.note ? `${esc(m.price.note)} · ` : ""}2026-09-30 기준 표준 요금 · <a href="${esc(m.price.source)}" target="_blank" rel="noopener">출처 ›</a></p></div>
    ${subHTML(m.co)}
    <div><h4>작업 1번에 드는 비용</h4><div class="kv">${TOKENS.map(([k, v]) => `<div><span>${k}<small> · ${v}</small></span><span class="num">약 ${taskCost(m, v)}</span></div>`).join("")}</div></div>`;
  return `<div class="works">${m.works.map(([t, by]) =>
    `<div class="work"><div class="th">미리보기</div><div class="cp">${esc(t)}<small>${esc(by)} · 예시</small></div></div>`).join("")}</div>`;
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
      <section class="fam-now"><h4>지금 라인업 <span class="real">실제 데이터</span></h4><p>${esc(f.now)}</p><small>${TIMELINE_CHECKED} 기준</small></section>
      ${models.length ? `<section><h4>LLM 차트의 모델 <span class="ex-tag">예시 점수</span></h4>${models.map((m) => `
        <button type="button" class="mres" data-m="${m.id}">${modelLogo(m)}
          <span><b>${esc(m.name)}</b><p>${esc(m.line)}</p></span><span class="go">자세히 ›</span></button>`).join("")}</section>` : ""}
      <section><h4>진화 타임라인</h4>${timelineHTML(key)}</section>
      <section><h4>관련 소식 <span class="ex-tag">예시</span></h4><div class="feed">${newsHTML(news)}</div></section>
      ${feats.length ? `<section><h4>이 계열이 있는 기능 <span class="ex-tag">예시</span></h4>${feats.map((r) => `
        <div class="res">${logo(r.co)}<div><b>${esc(r.feat)}</b><p>${esc(r.k)} · ${esc(r.plan)} · ${esc(r.model)}</p></div></div>`).join("")}</section>` : ""}
    </div>`);
  $("#sheet").querySelectorAll("[data-m]").forEach((b) => b.onclick = () => openModel(b.dataset.m, "evo"));
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
        <div><b>${esc(r.feat)}</b><p>${COMPANIES[r.co].name} · ${esc(r.plan)} · ${esc(r.model)}</p>
        <div class="ex">예시 작업물 · ${esc(r.ex)}</div></div>
      </div>`).join("");
  } else {
    title = `‘${esc(q)}’ 검색 결과`;
    body = `<p style="color:var(--sub)">찾는 결과가 없어요. AI 이름(GPT, 클로드, 제미나이…)이나 아래 예시로 검색해 보세요.</p>`;
  }
  openSheet(`
    <div class="sh-top"><div class="nm"><b>${title}</b><small>${models.length ? "눌러서 기능 한눈에 보기" : "회사 · 요금제 · 모델"}</small></div>
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
// 주요 소식과 같은 카테고리 탭: 실제 타임라인(출시→모델 출시, 업데이트→기능, 종료→지원 종료) + 주요 소식(예시)
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
    .map(({ n, i }) => ({ type: "news", i, label: n.title, co: n.co, when: n.time, ntype: tab }));
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
      + (ex.length ? `<div class="sg-head">주요 소식 <span class="ex-tag">예시</span></div>` + ex.map((it, j) => row(it, real.length + j)).join("") : "")
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
  else if (it.type === "model") { qInput.value = it.label; openModel(it.id, "info"); }
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
