-- 서버의 세션 기록(DATA_MODEL §3.10, ARCHITECTURE §6, D-112). 로그인(접근 열쇠 대조 성공)마다 한 행.
-- 서명이 맞아도 이 행이 없으면 401이다 — 로그아웃은 행을 지워 지운 cookie의 사본을 끊는다.
-- 접근 열쇠·비밀번호·일기 내용은 두지 않는다. last_active_at은 잠금 판정에만 쓴다.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 16 AND 64),
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 32),
  key_login_at TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL,
  locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1))
);

CREATE INDEX sessions_by_subject ON sessions (subject);
CREATE INDEX sessions_by_issued_at ON sessions (issued_at);
