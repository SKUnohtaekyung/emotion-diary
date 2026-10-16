-- 모든 기록 지우기의 세대 번호(TASK-DATA-02, D-124 — PR #43 리뷰). 지우기는 다른 기기의 세션 행을 지우고 이 기기 세션의 data_epoch를 올린다.
-- 행을 새로 만드는 쓰기(오늘 기록 만들기·owner 설정 upsert)는 같은 SQL 문 안에서 '요청을 받을 때 읽은 세션이 아직 같은 세대인가'를 본다 —
-- 세션 확인을 이미 지나 날아오던 쓰기가 지우기 batch 뒤에 들어와 기록을 되살리지 못하게(세션 행만 지워서는 막지 못한다).
ALTER TABLE sessions ADD COLUMN data_epoch INTEGER NOT NULL DEFAULT 0 CHECK (typeof(data_epoch) = 'integer' AND data_epoch >= 0);
