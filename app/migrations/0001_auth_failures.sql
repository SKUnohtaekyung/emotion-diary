-- 틀린 접근 열쇠의 전역 잠금 카운터(DATA_MODEL §3.9, ARCHITECTURE §6). 1인 도구라 IP별이 아니라 한 행이다.
-- 열쇠·해시 같은 값은 두지 않는다. 시각은 UTC ISO-8601 문자열(DATA_MODEL §2).
CREATE TABLE auth_failures (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  fail_count INTEGER NOT NULL DEFAULT 0 CHECK (fail_count >= 0),
  window_start TEXT,
  locked_until TEXT
);

INSERT INTO auth_failures (id, fail_count) VALUES (1, 0);
