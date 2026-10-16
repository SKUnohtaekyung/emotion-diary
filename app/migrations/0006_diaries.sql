-- 일기 창고(DATA_MODEL §3.1~§3.3, TASK-DATA-01 — D-122). 하루 한 기록·판 번호·완료 보호를 창고 규칙으로도 지킨다.
-- 시각은 UTC ISO-8601(`toISOString()` 모양 — strftime 왕복으로 확인), 날짜는 YYYY-MM-DD.
-- 글자 수는 length()(코드 포인트 — 서버의 셈과 같다)로 센다. length()는 NUL 앞까지만 세므로 글 칸은 NUL을 따로 막는다.
-- 길이·범위 수는 app/shared/diary.ts의 상수와 같다. 9개 계열과 작성 단계의 목록은 여기에 박지 않는다 — 모양만 보고 서버가 대조한다.
-- SQLite에서 CHECK를 바꾸려면 표를 다시 지어야 해서다(RK-045). 공백 판정의 char(…) 목록은 박는다 — '비어 있음'의 정의이고
-- app/shared/diary.ts의 WHITESPACE_CODE_POINTS(JS 정규식 \s와 같은 집합)와 같다. SQLite trim()은 기본으로 빈칸 하나만 지운다.
-- 둘이 같은지는 서버 시험이 문자마다 대조한다.

-- 일기 한 편. 하루 한 행(UNIQUE). write_token은 요청마다 새 무작위 값 — 같은 batch의 딸린 행 문장이 '이번 요청이 부모를 바꿨다'를 확인한다.
-- resume_step·resume_category는 쓰던 단계(RK-043). timezone은 이 기록의 날짜를 정한 시간대(처음 만들 때).
CREATE TABLE diary_entries (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  owner_key TEXT NOT NULL CHECK (length(owner_key) BETWEEN 1 AND 64),
  entry_date TEXT NOT NULL CHECK (length(entry_date) = 10 AND date(entry_date) IS entry_date),
  timezone TEXT NOT NULL CHECK (length(timezone) BETWEEN 1 AND 64),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  event_text TEXT NOT NULL DEFAULT '' CHECK (length(event_text) <= 10000 AND instr(event_text, char(0)) = 0),
  reason_text TEXT NOT NULL DEFAULT '' CHECK (length(reason_text) <= 10000 AND instr(reason_text, char(0)) = 0),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (typeof(revision) = 'integer' AND revision >= 1),
  taxonomy_version TEXT NOT NULL CHECK (length(taxonomy_version) BETWEEN 1 AND 64),
  resume_step TEXT CHECK (resume_step IS NULL OR (length(resume_step) BETWEEN 1 AND 16 AND resume_step NOT GLOB '*[^a-z]*')),
  resume_category TEXT CHECK (resume_category IS NULL OR (resume_step IS 'details' AND length(resume_category) BETWEEN 1 AND 32)),
  write_token TEXT NOT NULL CHECK (length(write_token) = 36),
  first_completed_at TEXT CHECK (first_completed_at IS NULL OR first_completed_at IS strftime('%Y-%m-%dT%H:%M:%fZ', first_completed_at)),
  first_completed_local_date TEXT CHECK (first_completed_local_date IS NULL OR (length(first_completed_local_date) = 10 AND date(first_completed_local_date) IS first_completed_local_date)),
  completed_at TEXT CHECK (completed_at IS NULL OR completed_at IS strftime('%Y-%m-%dT%H:%M:%fZ', completed_at)),
  created_at TEXT NOT NULL CHECK (created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  updated_at TEXT NOT NULL CHECK (updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at)),
  CHECK (status <> 'completed' OR (first_completed_at IS NOT NULL AND completed_at IS NOT NULL AND first_completed_local_date IS NOT NULL)),
  CHECK (status <> 'completed' OR (
    trim(event_text, char(9, 10, 11, 12, 13, 32, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288, 65279)) <> ''
    AND trim(reason_text, char(9, 10, 11, 12, 13, 32, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288, 65279)) <> ''
  )),
  UNIQUE (owner_key, entry_date)
);

-- 오늘 화면의 '지난 임시저장'을 찾는 색인 — 완료된 날들을 건너뛰며 읽지 않게 임시저장만 담는다.
CREATE INDEX diary_entries_drafts_by_date ON diary_entries (owner_key, entry_date) WHERE status = 'draft';

-- 고른 계열(마음 고르기, UX_SPEC §4 2단계)과 대표 크기(4단계). 세부 감정을 아직 안 고른 계열·아직 안 정한 크기(NULL)도 임시저장에 남는다.
CREATE TABLE diary_categories (
  diary_id TEXT NOT NULL REFERENCES diary_entries (id) ON DELETE CASCADE,
  category_code TEXT NOT NULL CHECK (length(category_code) BETWEEN 1 AND 32 AND category_code NOT GLOB '*[^a-z]*'),
  display_order INTEGER NOT NULL CHECK (typeof(display_order) = 'integer' AND display_order BETWEEN 0 AND 99),
  intensity INTEGER CHECK (intensity IS NULL OR (typeof(intensity) = 'integer' AND intensity BETWEEN 1 AND 10)),
  PRIMARY KEY (diary_id, category_code)
) WITHOUT ROWID;

-- 고른 세부 감정. 저장 단위는 세부 감정이다(D-059) — intensity는 실제 크기이고, 따로 정하지 않았으면(intensity_custom 0) 계열의 대표 크기다.
-- 표시명(label_snapshot)은 고를 때의 사전 표기이고 나중에 고쳐 쓰지 않는다(DATA_MODEL §4.1-4). 계열은 코드의 접두어와 같아야 한다.
CREATE TABLE diary_emotions (
  diary_id TEXT NOT NULL,
  category_code TEXT NOT NULL,
  emotion_code TEXT NOT NULL CHECK (length(emotion_code) BETWEEN 3 AND 64 AND substr(emotion_code, 1, length(category_code) + 1) = category_code || '-'),
  label_snapshot TEXT NOT NULL CHECK (length(label_snapshot) BETWEEN 1 AND 100 AND instr(label_snapshot, char(0)) = 0),
  intensity INTEGER CHECK (intensity IS NULL OR (typeof(intensity) = 'integer' AND intensity BETWEEN 1 AND 10)),
  intensity_custom INTEGER NOT NULL DEFAULT 0 CHECK (intensity_custom IN (0, 1)),
  display_order INTEGER NOT NULL CHECK (typeof(display_order) = 'integer' AND display_order BETWEEN 0 AND 99),
  PRIMARY KEY (diary_id, emotion_code),
  FOREIGN KEY (diary_id, category_code) REFERENCES diary_categories (diary_id, category_code) ON DELETE CASCADE,
  CHECK (intensity_custom = 0 OR intensity IS NOT NULL)
) WITHOUT ROWID;

-- 칭찬·감사 각 3칸. 빈칸은 행을 만들지 않는다 — 행이 있으면 글이 있다.
CREATE TABLE diary_reflections (
  diary_id TEXT NOT NULL REFERENCES diary_entries (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('praise', 'gratitude')),
  slot INTEGER NOT NULL CHECK (typeof(slot) = 'integer' AND slot BETWEEN 1 AND 3),
  text TEXT NOT NULL CHECK (
    length(text) <= 2000
    AND instr(text, char(0)) = 0
    AND trim(text, char(9, 10, 11, 12, 13, 32, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288, 65279)) <> ''
  ),
  PRIMARY KEY (diary_id, kind, slot)
) WITHOUT ROWID;

-- 완료된 기록은 세부 감정이 하나는 남아야 한다(DATA_MODEL §3.1). 기록을 지울 때는 부모를 먼저 지운다 —
-- 연쇄 삭제가 감정 행에 닿을 때는 부모가 이미 없어 이 규칙에 걸리지 않는다(DATA_MODEL §8, 2026-09-02 스파이크).
CREATE TRIGGER diary_emotions_keep_one_when_completed
BEFORE DELETE ON diary_emotions
WHEN (SELECT status FROM diary_entries WHERE id = OLD.diary_id) = 'completed'
  AND (SELECT count(*) FROM diary_emotions WHERE diary_id = OLD.diary_id) = 1
BEGIN
  SELECT RAISE(ABORT, 'diary_completed_needs_emotion');
END;

-- 완료된 기록의 크기는 '아직 안 정함'(NULL)일 수 없다 — 저장 도중에도 정당하지 않은 값이라 행마다 막는다.
CREATE TRIGGER diary_categories_completed_intensity_insert
BEFORE INSERT ON diary_categories
WHEN NEW.intensity IS NULL AND (SELECT status FROM diary_entries WHERE id = NEW.diary_id) = 'completed'
BEGIN
  SELECT RAISE(ABORT, 'diary_completed_needs_intensity');
END;

CREATE TRIGGER diary_categories_completed_intensity_update
BEFORE UPDATE OF intensity ON diary_categories
WHEN NEW.intensity IS NULL AND (SELECT status FROM diary_entries WHERE id = NEW.diary_id) = 'completed'
BEGIN
  SELECT RAISE(ABORT, 'diary_completed_needs_intensity');
END;

CREATE TRIGGER diary_emotions_completed_intensity_insert
BEFORE INSERT ON diary_emotions
WHEN NEW.intensity IS NULL AND (SELECT status FROM diary_entries WHERE id = NEW.diary_id) = 'completed'
BEGIN
  SELECT RAISE(ABORT, 'diary_completed_needs_intensity');
END;

CREATE TRIGGER diary_emotions_completed_intensity_update
BEFORE UPDATE OF intensity ON diary_emotions
WHEN NEW.intensity IS NULL AND (SELECT status FROM diary_entries WHERE id = NEW.diary_id) = 'completed'
BEGIN
  SELECT RAISE(ABORT, 'diary_completed_needs_intensity');
END;

-- 완료 조건 전체(세부 감정 1개 이상, 고른 계열마다 세부 감정, 모든 크기가 정해짐). 상태 칸을 쓰는 UPDATE에서만 본다 —
-- 완료 전환과, 서버가 완료된 기록의 딸린 행을 바꾼 batch 끝에 두는 `SET status = status`. 저장의 첫 부모 갱신은 상태 칸을 쓰지 않으므로,
-- 딸린 행이 어떤 이유로 어긋난 기록도 올바른 저장 한 번으로 고칠 수 있다(어긋난 상태가 모든 저장을 막지 않는다).
CREATE TRIGGER diary_entries_completed_consistent
BEFORE UPDATE OF status ON diary_entries
WHEN NEW.status = 'completed' AND (
  NOT EXISTS (SELECT 1 FROM diary_emotions WHERE diary_id = NEW.id)
  OR EXISTS (SELECT 1 FROM diary_emotions WHERE diary_id = NEW.id AND intensity IS NULL)
  OR EXISTS (
    SELECT 1 FROM diary_categories AS c
     WHERE c.diary_id = NEW.id
       AND (c.intensity IS NULL OR NOT EXISTS (SELECT 1 FROM diary_emotions AS e WHERE e.diary_id = c.diary_id AND e.category_code = c.category_code))
  )
)
BEGIN
  SELECT RAISE(ABORT, 'diary_completed_incomplete');
END;

-- 판 번호는 늘기만 한다(오래된 화면이 덮지 못하게 하는 근거 — F-09).
CREATE TRIGGER diary_entries_revision_only_grows
BEFORE UPDATE OF revision ON diary_entries
WHEN NEW.revision <= OLD.revision
BEGIN
  SELECT RAISE(ABORT, 'diary_revision_must_grow');
END;

-- 최초 완료 시각·날짜는 한 번 정해지면 바뀌지 않는다 — streak의 유일한 작성일 기준이다(DATA_MODEL §3.1·§5).
CREATE TRIGGER diary_entries_first_completion_kept
BEFORE UPDATE OF first_completed_at, first_completed_local_date ON diary_entries
WHEN OLD.first_completed_at IS NOT NULL
  AND (NEW.first_completed_at IS NOT OLD.first_completed_at OR NEW.first_completed_local_date IS NOT OLD.first_completed_local_date)
BEGIN
  SELECT RAISE(ABORT, 'diary_first_completion_kept');
END;
