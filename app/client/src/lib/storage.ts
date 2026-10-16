// localStorage·sessionStorage는 막혀 있을 수 있다(비공개 창·설정). 읽고 쓰는 곳을 여기 하나로 모아 try/catch로 감싼다.
// 여기에 두는 것은 화면 이름·시각·표식뿐이다. 열쇠·이름·비밀번호는 두지 않는다(DATA_MODEL §6).
// 일기 내용의 예외는 하나 — 서버로 아직 보내지 못한 글(unsentDiaries, ../write/unsent.ts)만 보내질 때까지 둔다
// (TASK-SLICE-01 사용자 결정 U-2 '못 보낸 글만 휴대폰에 잠깐').

type Kind = "local" | "session";

export const KEYS = {
  /** 설치 안내 줄을 닫았다는 표시(localStorage) */
  installHintClosed: "installHintClosed",
  /** 마지막으로 화면이 숨은 시각, 숫자만(localStorage) */
  lastHiddenAt: "lastHiddenAt",
  /** 로그인이 끝난 뒤 돌아갈 화면 이름(sessionStorage) — 열쇠·query 없음 */
  returnTo: "returnTo",
  /** 이 탭이 이미 시작했다는 표식(sessionStorage, T3 A-15) */
  alive: "alive",
  /** 비밀번호를 잊어 다시 들어오는 중이라는 표시(sessionStorage) */
  forgotPin: "forgotPin",
  /** 서버로 아직 보내지 못한 글, 날짜별(localStorage) — 응답을 받으면 지운다(U-2) */
  unsentDiaries: "unsentDiaries"
} as const;

function store(kind: Kind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStored(kind: Kind, key: string): string | null {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(kind: Kind, key: string, value: string): void {
  try {
    store(kind)?.setItem(key, value);
  } catch {
    // 저장이 막혀도 앱은 쓸 수 있어야 한다
  }
}

export function removeStored(kind: Kind, key: string): void {
  try {
    store(kind)?.removeItem(key);
  } catch {
    // 위와 같다
  }
}
