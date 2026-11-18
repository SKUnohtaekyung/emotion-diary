// 불러오기 상태(D-083 ①, status-block.md, 시안 web/js/dom.js renderStatus): 뼈대 막대 셋 / 오류 / 연결 끊김 + '다시 시도'.
// 어두운 숲 위에서는 tone="dark". 오류는 role=alert, 나머지는 role=status.

export type StatusKind = "loading" | "error" | "offline";

const TEXT: Record<Exclude<StatusKind, "loading">, [string, string]> = {
  error: ["불러오지 못했어요", "잠시 뒤 다시 시도해 주세요."],
  offline: ["연결이 끊겼어요", "연결되면 다시 불러올게요."]
};

export function StatusBlock({ kind, onRetry, tone = "light" }: { kind: StatusKind; onRetry?: () => void; tone?: "light" | "dark" }) {
  if (kind === "loading") {
    return (
      <div class={`status-block is-loading ${tone}`} role="status">
        <span class="sr-only">불러오는 중이에요</span>
        <i />
        <i />
        <i />
      </div>
    );
  }
  const [title, detail] = TEXT[kind];
  return (
    <div class={`status-block is-${kind} ${tone}`} role={kind === "error" ? "alert" : "status"}>
      <p class="status-title">{title}</p>
      <p class="status-detail">{detail}</p>
      {onRetry ? (
        <button type="button" class="btn btn-quiet status-retry" onClick={onRetry}>
          다시 시도
        </button>
      ) : null}
    </div>
  );
}
