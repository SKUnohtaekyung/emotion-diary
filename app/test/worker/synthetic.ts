// 합성 일기(가짜 데이터) — 내보내기 페이지·CPU 측정·복원 시험이 같이 쓴다. 실제 일기·식별정보는 넣지 않는다(AGENTS §3).
import type { DiaryEntryView } from "../../shared/diary";
import { EMOTIONS } from "../../shared/taxonomy";

const pick = (category: string) => [...EMOTIONS].filter(([, info]) => info.category === category).map(([code, info]) => ({ code, label: info.label }));
const JOY = pick("joy");
const SAD = pick("sadness");

/** 합성 기록 하나 — 실제 쓰임새(사건·이유 몇 문장, 계열 둘, 세부 감정 셋, 칭찬·감사 하나씩)에 가깝게. */
export function syntheticEntry(date: string, index: number): DiaryEntryView {
  const at = `${date}T12:00:00.000Z`;
  const sentence = `가짜 일기 ${index}번: 오늘은 친구와 산책을 하고 저녁에 책을 조금 읽었다. `;
  return {
    schemaVersion: "diary-entry-v2",
    id: crypto.randomUUID(),
    entryDate: date,
    timezone: "Asia/Seoul",
    status: "completed",
    revision: 3,
    taxonomyVersion: "emotion-ko-v2",
    eventText: sentence.repeat(4),
    reasonText: sentence.repeat(2),
    categories: [
      { categoryCode: "joy", intensity: 6 },
      { categoryCode: "sadness", intensity: 3 }
    ],
    emotions: [
      { categoryCode: "joy", emotionCode: JOY[index % JOY.length]?.code ?? "", labelSnapshot: JOY[index % JOY.length]?.label ?? "x", intensity: 6, custom: false },
      { categoryCode: "joy", emotionCode: JOY[(index + 1) % JOY.length]?.code ?? "", labelSnapshot: JOY[(index + 1) % JOY.length]?.label ?? "x", intensity: 8, custom: true },
      { categoryCode: "sadness", emotionCode: SAD[index % SAD.length]?.code ?? "", labelSnapshot: SAD[index % SAD.length]?.label ?? "x", intensity: 3, custom: false }
    ],
    praises: [{ slot: 1, text: "끝까지 해냈다" }],
    gratitudes: [{ slot: 1, text: "같이 걸어 준 친구" }],
    resume: { step: "letter", categoryCode: null },
    firstCompletedAt: at,
    firstCompletedLocalDate: date,
    completedAt: at,
    createdAt: at,
    updatedAt: at
  };
}
