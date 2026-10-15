-- 하루 기준 시각(DATA_MODEL §2·§3.4, D-081, TASK-DATA-01 S-4). owner 공용 설정이라 알림 표가 아니라 owner_settings에 둔다.
-- 0~6시, 기본 4시. 바꿔도 이미 저장된 일기의 entry_date는 다시 계산하지 않는다(D-081). 모든 기록 지우기는 이 행째 지운다(D-112 ⑩).
ALTER TABLE owner_settings ADD COLUMN day_start_hour INTEGER NOT NULL DEFAULT 4 CHECK (typeof(day_start_hour) = 'integer' AND day_start_hour BETWEEN 0 AND 6);
