// 완료 `#/done/<날짜>` — 평면판(UX_SPEC §4 9번, TASK-SLICE-01 PLAN A-7). 짧은 사실 문장 하나와 버튼 둘.
// 칭찬·성장·연속 기록 문구를 쓰지 않는다. 아래는 같은 폭 두 버튼 — `달력 보기`(보조, 그날을 고른 채)·`통계 보기`(주)(D-078).
// 2026-11-11 달력·통계가 생겨 첫 조각의 '기록 보기·오늘로 돌아가기'를 바꿨다(TASK-REFLECT-01 A-10). 그날의 편지는 달력의 작은 편지 → 편지 열기로 연다.
// 지난 날의 글을 마무리했으면 작성 흐름이 `?day=past`를 붙인다 — '그날'로 말한다.
// 2026-11-11 Preact로 옮긴 첫 화면(D-127, TASK-REFLECT-01 R-0) — 모양·동작은 그대로다.

import { useEffect } from "preact/hooks";
import { announce } from "../lib/dom";
import { mountPreact } from "../lib/mount";
import { navigate, type ViewContext } from "../router";

function Done({ date, past }: { date: string; past: boolean }) {
  const day = past ? "그날" : "오늘";
  const message = `${day}의 마음을 남겼어요`;
  useEffect(() => announce(message), [message]);
  return (
    <section class="screen done">
      <h1>{message}</h1>
      <div class="screen-actions pair">
        <button type="button" class="btn btn-quiet btn-block" onClick={() => navigate(`#/calendar?d=${date}`, { replace: true })}>
          달력 보기
        </button>
        <button type="button" class="btn btn-primary btn-block" onClick={() => navigate("#/stats", { replace: true })}>
          통계 보기
        </button>
      </div>
    </section>
  );
}

export function renderDone({ root, route }: ViewContext): () => void {
  return mountPreact(root, <Done date={route.params.date ?? ""} past={route.query.get("day") === "past"} />);
}
