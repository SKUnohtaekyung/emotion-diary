-- owner 설정에 더해지는 부를 이름과 앱 잠금(DATA_MODEL §3.4, D-106, D-112). owner당 1행.
-- 앱 잠금이 켜졌는지는 해시가 있는지로만 가른다 — 따로 둔 켜짐 칸과 어긋날 수 없게(T3 A-10).
-- 해시는 서버 비밀값을 섞은 HMAC-SHA256의 16진수 64자다. 비밀번호 평문은 어디에도 두지 않는다.
-- 지금 잠겼는지는 여기가 아니라 세션마다 둔다(sessions.locked). 모든 기록 지우기는 이 행을 지운다(D-112 ⑩, data-foundation).
CREATE TABLE owner_settings (
  owner_key TEXT PRIMARY KEY CHECK (length(owner_key) BETWEEN 1 AND 64),
  display_name TEXT CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 12),
  app_lock_hash TEXT CHECK (app_lock_hash IS NULL OR length(app_lock_hash) = 64),
  app_lock_fail_count INTEGER NOT NULL DEFAULT 0 CHECK (app_lock_fail_count BETWEEN 0 AND 5),
  app_lock_retry_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
