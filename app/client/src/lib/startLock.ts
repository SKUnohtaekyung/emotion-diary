// '앱을 켤 때' 잠금을 청할지(T3 A-15, 잠정 — T-02 뒤 확정). 판단은 DOM과 떼어 두고 이유까지 돌려준다.
// 회수(앱 전환 중 메모리 정리)와 강제 종료를 가르는 공식 신호가 없어, 탐색 종류와 sessionStorage 표식으로 가른다.
// 서버의 5분 규칙이 실제 경계이고(ARCHITECTURE §6) 이것은 '켤 때'를 더하는 화면 쪽 요청이다.

export interface StartLockInput {
  /** performance navigation entry의 type: navigate·reload·back_forward·prerender */
  navType: string | undefined;
  /** 이 탭에 alive 표식이 이미 있었나 */
  hasMarker: boolean;
  appLock: boolean;
  locked: boolean;
}

export interface StartLockDecision {
  lock: boolean;
  reason: string;
}

export function startLockDecision(input: StartLockInput): StartLockDecision {
  if (!input.appLock) return { lock: false, reason: "앱 잠금이 꺼져 있어요" };
  if (input.locked) return { lock: false, reason: "이미 잠겨 있어요" };
  if (input.navType !== "navigate") {
    return { lock: false, reason: `탐색 종류가 ${input.navType ?? "알 수 없음"}이라 새로 켠 것이 아니에요` };
  }
  if (input.hasMarker) return { lock: false, reason: "이 탭에서 이미 시작한 표식이 있어요" };
  return { lock: true, reason: "새로 켠 것으로 봐요(navigate, 표식 없음)" };
}

export function shouldLockOnStart(input: StartLockInput): boolean {
  return startLockDecision(input).lock;
}

export function readNavType(): string | undefined {
  try {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return entry?.type;
  } catch {
    return undefined;
  }
}
