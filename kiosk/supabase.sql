-- ============================================================
-- AI 키오스크 — Supabase 데이터베이스 설정
-- Supabase 대시보드 → SQL Editor → 이 파일 내용 전체를 붙여넣고 Run
-- 맨 아래 'admin@example.com' 을 관리자 로그인 이메일로 바꿔서 실행하세요.
-- 여러 번 실행해도 안전해요.
-- ============================================================

-- 1) 테이블 ----------------------------------------------------

-- 한 사람(세션): 첫 화면에서 버튼을 누르면 시작
create table if not exists public.sessions (
  id          uuid primary key,
  started_at  timestamptz not null default now(),
  entry       text,                -- news(AI 소식) / archive(작업별 AI 추천) / direct
  kiosk_id    text,                -- 키오스크 기기 구분
  screen_w    int,
  screen_h    int,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- 이용 기록: 페이지 이동·머문 시간·클릭·설문 진행
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  session_id  uuid not null,
  ts          timestamptz not null,
  type        text not null check (char_length(type) <= 40),
  page        text check (char_length(page) <= 200),
  target      text check (char_length(target) <= 200),
  duration_ms bigint,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists events_session_idx on public.events (session_id);
create index if not exists events_type_idx on public.events (type);
create index if not exists events_ts_idx on public.events (ts);

-- 설문 응답 (익명): 끝까지 했거나, 중간에 그만둔 시점까지
create table if not exists public.survey_responses (
  id            bigint generated always as identity primary key,
  session_id    uuid not null,
  opened_on     text,              -- 설문을 연 페이지
  started_at    timestamptz,
  finished_at   timestamptz,
  completed     boolean not null default false,
  last_question text,
  answers       jsonb,             -- { "q1": "정보보안", "q4": ["유튜브", ...], ... }
  details       jsonb,             -- 자세히 쓰기(선택) { "q4": "..." }
  kiosk_id      text,
  created_at    timestamptz not null default now()
);
create index if not exists survey_session_idx on public.survey_responses (session_id);

-- 추첨 응모: 설문과 연결하지 않고 따로 보관 (발송 후 관리자 페이지에서 일괄 삭제)
create table if not exists public.raffle_entries (
  id           bigint generated always as identity primary key,
  phone        text not null unique check (phone ~ '^01[016789][0-9]{7,8}$'),
  consented_at timestamptz not null,
  kiosk_id     text,
  created_at   timestamptz not null default now()
);

-- 관리자 목록 (이 이메일로 로그인한 사람만 분석 페이지에서 데이터를 볼 수 있어요)
create table if not exists public.admins (
  email text primary key
);

-- 2) 권한 (RLS) ----------------------------------------------------
alter table public.sessions          enable row level security;
alter table public.events            enable row level security;
alter table public.survey_responses  enable row level security;
alter table public.raffle_entries    enable row level security;
alter table public.admins            enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['sessions', 'events', 'survey_responses', 'raffle_entries'] loop
    -- 키오스크(로그인 없음): 쓰기만 가능, 읽기·수정·삭제 불가
    execute format('drop policy if exists "kiosk insert" on public.%I', t);
    execute format('create policy "kiosk insert" on public.%I for insert to anon with check (true)', t);
    -- 관리자: 읽기
    execute format('drop policy if exists "admin read" on public.%I', t);
    execute format('create policy "admin read" on public.%I for select to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- 테이블 접근 권한 (새 프로젝트는 자동으로 안 열려 있을 수 있어요)
grant usage on schema public to anon, authenticated;
grant insert on public.sessions, public.events, public.survey_responses, public.raffle_entries to anon;
grant select on public.sessions, public.events, public.survey_responses, public.raffle_entries, public.admins to authenticated;
grant delete on public.raffle_entries to authenticated;

-- 관리자: 추첨 명단 삭제 (경품 발송 후 파기)
drop policy if exists "admin delete" on public.raffle_entries;
create policy "admin delete" on public.raffle_entries for delete to authenticated using (public.is_admin());

-- 관리자 목록은 본인 것만 확인 가능
drop policy if exists "admin self" on public.admins;
create policy "admin self" on public.admins for select to authenticated using (email = (auth.jwt() ->> 'email'));

-- 3) 관리자 이메일 등록 — 'admin@example.com' 을 바꾸세요 -----------
insert into public.admins (email) values ('admin@example.com') on conflict do nothing;
