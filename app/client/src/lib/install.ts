// 홈 화면 앱인지(T3 A-13). 기기·OS 버전 문자열로 가르지 않고 기능을 직접 묻는다(ARCHITECTURE §4.1).
// display-mode가 설치 앱에서 standalone이 아닌 fullscreen으로 올 수 있다는 보고(bugs 264218)가 있어 둘 다 보고,
// iOS의 navigator.standalone도 함께 본다.

export interface InstallEnv {
  matchMedia: (query: string) => { matches: boolean };
  navigator: { standalone?: boolean };
}

export function isInstalled(env: InstallEnv = window as unknown as InstallEnv): boolean {
  return (
    env.matchMedia("(display-mode: standalone)").matches ||
    env.matchMedia("(display-mode: fullscreen)").matches ||
    env.navigator.standalone === true
  );
}

/** 설치 안내 줄을 보일지: 홈 화면 앱이 아니고, 터치 기기이고, 닫은 적이 없을 때만. */
export function shouldShowInstallHint(input: { installed: boolean; coarsePointer: boolean; closed: boolean }): boolean {
  return !input.installed && input.coarsePointer && !input.closed;
}
