-- 화면 오류 보고(D-113 ②, D-115 ⑤). 개발용 건물에서만 채워진다 — 운영 묶음에는 받는 경로가 없어 빈 표로 남는다.
-- 두 환경의 스키마를 같게 두려고 운영에도 만든다(T3 A-10). 받는 칸은 정해진 일곱 칸뿐이고 메시지·stack·입력값 칸은 없다.
CREATE TABLE client_errors (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('error', 'unhandledrejection', 'api')),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  source TEXT NOT NULL CHECK (length(source) BETWEEN 1 AND 120),
  line INTEGER NOT NULL CHECK (line >= 0),
  col INTEGER NOT NULL CHECK (col >= 0),
  build TEXT NOT NULL CHECK (length(build) BETWEEN 1 AND 40),
  route TEXT NOT NULL CHECK (length(route) BETWEEN 1 AND 40)
);

CREATE INDEX client_errors_by_created_at ON client_errors (created_at);
