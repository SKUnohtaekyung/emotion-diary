-- 중복 요청의 영수증(DATA_MODEL §3.7, EVAL_PLAN F-10, TASK-DATA-01 S-6). 같은 열쇠로 다시 온 같은 요청에는 첫 응답을 그대로 돌려준다.
-- request_hash는 방식·경로·본문 바이트의 SHA-256 16진수. 응답에는 일기 글을 담지 않는다(번호·판 번호·상태·시각만) — 크기 상한이 그 겹이다.
-- 만료(24시간)된 영수증은 쓰기 요청마다 같은 batch에서 지운다. 모든 기록 지우기는 owner의 영수증도 지운다(data-control).
CREATE TABLE idempotency_records (
  owner_key TEXT NOT NULL CHECK (length(owner_key) BETWEEN 1 AND 64),
  operation TEXT NOT NULL CHECK (length(operation) BETWEEN 1 AND 40),
  idempotency_key TEXT NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 64),
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  response_status INTEGER NOT NULL CHECK (response_status BETWEEN 200 AND 299),
  response_json TEXT NOT NULL CHECK (length(response_json) <= 1000),
  created_at TEXT NOT NULL CHECK (created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  expires_at TEXT NOT NULL CHECK (expires_at IS strftime('%Y-%m-%dT%H:%M:%fZ', expires_at)),
  PRIMARY KEY (owner_key, operation, idempotency_key)
) WITHOUT ROWID;

CREATE INDEX idempotency_records_by_expires_at ON idempotency_records (expires_at);
