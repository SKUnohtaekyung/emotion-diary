// 글자 수와 남은 시간을 읽기 쉬운 말로 바꾼다. DOM과 떼어 두어 시험한다.

/** 남은 초를 'N분 N초'로. 0분이면 'N초', 딱 떨어지면 'N분'. */
export function formatRemaining(totalSeconds: number): string {
  const total = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds}초`;
  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
}

/** 코드 포인트 수. 한글 조합·이모지를 한 글자로 센다(서버 D1의 length()와 같은 셈, api.ts normalizeName). */
export function codePointLength(value: string): number {
  return [...value].length;
}
