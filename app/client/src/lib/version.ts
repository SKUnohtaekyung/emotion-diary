// 새 버전 알림(T3 A-5). 판단만 하고 아무것도 하지 않는다 — 새로 고치는 것은 사용자가 띠의 버튼을 누를 때뿐이다.
// 쓰는 중에 저절로 새로 고치면 입력을 잃는다(RK-034·RK-037).

export interface VersionNotice {
  kind: "build" | "compat";
  message: string;
}

export function versionNotice(
  serverBuild: string,
  serverCompat: number,
  clientBuild: string,
  clientCompat: number
): VersionNotice | null {
  // 서버가 화면보다 앞선 호환 단계면 저장이 어긋날 수 있다 — 문구가 바뀌고, 작성 흐름은 보내기를 멈추고 사본만 쓴다(write/saver blockSending, TASK-SLICE-01 A-14).
  if (serverCompat > clientCompat) return { kind: "compat", message: "새로 고쳐야 저장할 수 있어요" };
  if (serverBuild !== clientBuild) return { kind: "build", message: "새 버전이 있어요" };
  return null;
}
