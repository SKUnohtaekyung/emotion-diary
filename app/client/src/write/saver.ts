// 작성 흐름의 저장 줄(TASK-SLICE-01 PLAN A-11·§3.3·§3.4).
// - 서버 요청은 한 번에 하나. 답을 받지 못한 요청은 같은 영수증 열쇠·같은 본문으로 다시 보낸다(이미 반영됐으면 서버가 같은 답을 돌려준다).
//   새 내용은 앞 요청의 답을 받은 뒤 새 열쇠와 새 판 번호로 보낸다 — 그래서 우리 요청끼리는 판 번호가 엇갈리지 않는다.
// - draft 모드: 입력이 800ms 멈추면, 단계를 옮기면, 화면이 숨으면 보낸다. edit 모드(완료한 기록 고치기): 저절로 보내지 않고
//   saveEdit()에서만 — 완료된 기록은 저장마다 완료 조건을 다시 검사해 중간 상태가 422가 되기 때문이다(PLAN U-3).
// - 화면의 글이 서버보다 앞서는 동안 기기 사본(./unsent)을 300ms 뒤에 쓰고, 그 순번까지 서버가 받으면 지운다.
// - 닫아도(×) 보낼 것이 남았으면 끝까지 보낸다 — 같은 날짜를 다시 열면 살아 있는 저장 줄을 그대로 쓴다(liveSaver).

import type { DiaryInput, DiaryMeta } from "../../../shared/diary";
import type { ApiResult } from "../lib/api";
import { newRequestKey, putDiary } from "./api";
import { isUntouched, type StepKey, toInput, type WorkingDiary } from "./flow";
import { type FlowMode, removeUnsent, writeUnsent } from "./unsent";

export const SEND_AFTER_MS = 800;
export const COPY_AFTER_MS = 300;
/** 다시 보내는 간격 — 그 뒤로는 마지막 값을 되풀이한다(화면이 보이는 동안만). */
export const RETRY_MS = [2_000, 5_000, 15_000, 30_000] as const;

export type SaveState =
  | "idle" // 보낼 것이 없다(새 글을 아직 쓰지 않았다)
  | "pending" // 바뀐 것이 있고 곧 보낸다
  | "saving"
  | "saved"
  | "offline" // 서버에 닿지 못했다 — 같은 열쇠로 다시
  | "failed" // 서버가 받지 않았다(화면 결함·서버 오류) — 다시 시도로
  | "conflict" // 다른 곳에서 고쳤거나 지웠다 — 덮지 않는다(PLAN A-13)
  | "held" // 로그인 풀림·잠김·새 버전·날짜 바뀜 — 풀릴 때까지 보내지 않는다
  | "editing"; // edit 모드에서 고친 것이 있다(저장하기 전)

export interface SaveStatus {
  state: SaveState;
  revision: number | null;
  /** 서버가 아직 받지 않은 글이 있는가 */
  unsent: boolean;
  /** 마지막으로 서버가 받은 시각(ms) */
  savedAt: number | null;
}

export type SendFn = (date: string, body: DiaryInput, key: string) => Promise<ApiResult<DiaryMeta>>;

export interface SaverInit {
  date: string;
  mode: FlowMode;
  /** 서버에서 확인한 판 번호(아직 없는 새 글이면 null) */
  revision: number | null;
  diary: WorkingDiary;
  step: StepKey | null;
  /** 기기 사본에서 되살린 경우: 답을 받지 못했던 요청과 '서버보다 앞섬' */
  pending?: { key: string; body: DiaryInput } | null;
  ahead?: boolean;
  send?: SendFn;
}

export interface SaverEvents {
  onStatus?: (status: SaveStatus) => void;
  /** 409 revision_conflict(다른 곳에서 고침) 또는 404(다른 곳에서 지움 — currentRevision null) */
  onConflict?: (currentRevision: number | null) => void;
  /** 아직 만들지 않은 새 글이 422 not_today를 받았다(하루 기준 시각을 넘김 — PLAN A-12) */
  onNotToday?: () => void;
}

interface Pending {
  key: string;
  seq: number;
  body: DiaryInput;
}

const live = new Map<string, Saver>();

/** 서버가 화면보다 앞선 호환 단계다(새 버전 띠 '새로 고쳐야 저장할 수 있어요' — PLAN A-14). 그동안 보내지 않고 사본만 쓴다. */
let sendingBlocked = false;

export function isSendingBlocked(): boolean {
  return sendingBlocked;
}

/** state.applySession이 부른다. 풀리면 멈춰 둔 것을 보낸다(실제로는 새로 고친 뒤 사본에서 되살려 보낸다). */
export function blockSending(on: boolean): void {
  if (sendingBlocked === on) return;
  sendingBlocked = on;
  for (const saver of live.values()) {
    if (on) saver.hold();
    else saver.retryNow();
  }
}

/** 이 날짜의 살아 있는 저장 줄(닫은 뒤에도 보낼 것이 남아 있으면 있다). */
export function liveSaver(date: string): Saver | null {
  return live.get(date) ?? null;
}

export function allSavers(): Saver[] {
  return [...live.values()];
}

/** 시험에서 비운다. */
export function resetSaversForTest(): void {
  for (const saver of live.values()) saver.stopForTest();
  live.clear();
  sendingBlocked = false;
}

export class Saver {
  date: string;
  readonly mode: FlowMode;
  revision: number | null;
  diary: WorkingDiary;
  step: StepKey | null;
  private seq = 0;
  private savedSeq = 0;
  private pending: Pending | null = null;
  private inFlight = false;
  private holdReason: "held" | "conflict" | null = null;
  private state: SaveState = "idle";
  private savedAt: number | null = null;
  private attempt = 0;
  private copyTimer: number | undefined;
  private sendTimer: number | undefined;
  private retryTimer: number | undefined;
  private waiters: Array<(ok: boolean) => void> = [];
  private events: SaverEvents = {};
  private attached = false;
  private flight: Promise<ApiResult<DiaryMeta>> | null = null;
  /** 지운 줄 — 늦게 온 답·타이머가 아무것도 하지 않는다 */
  private ended = false;
  /** 지우기를 기다리는 동안 얼림 */
  private frozen = false;
  private readonly send: SendFn;

  constructor(init: SaverInit) {
    this.date = init.date;
    this.mode = init.mode;
    this.revision = init.revision;
    this.diary = init.diary;
    this.step = init.step;
    this.send = init.send ?? putDiary;
    if (init.pending) {
      // 되살린 요청은 순번 1, 그 뒤의 내용이 있으면 순번 2로 둔다
      this.pending = { key: init.pending.key, seq: 1, body: init.pending.body };
      this.seq = init.ahead ? 2 : 1;
    } else if (init.ahead) {
      this.seq = 1;
    }
    this.state = this.unsent ? (this.mode === "edit" ? "editing" : "pending") : this.revision === null ? "idle" : "saved";
    live.set(this.date, this);
  }

  get unsent(): boolean {
    return this.seq > this.savedSeq || this.pending !== null;
  }

  status(): SaveStatus {
    return { state: this.state, revision: this.revision, unsent: this.unsent, savedAt: this.savedAt };
  }

  /** 화면이 붙는다(다시 열면 새 화면이 다시 붙는다). null이면 뗀다 — 저장은 계속된다. */
  attach(events: SaverEvents | null): void {
    this.events = events ?? {};
    this.attached = events !== null;
  }

  private setState(state: SaveState): void {
    this.state = state;
    this.events.onStatus?.(this.status());
  }

  /**
   * 글이나 단계가 바뀌었다. 단계 옮김은 immediate — 단계도 저장 내용이다(draft).
   * stepOnly: 단계만 옮겼다 — 고치기 모드에서는 고친 것이 아니므로 순번·사본을 건드리지 않는다(마감 검토 M-2).
   */
  update(diary: WorkingDiary, step: StepKey | null, options: { immediate?: boolean; stepOnly?: boolean } = {}): void {
    if (this.ended) return;
    if (this.mode === "edit" && options.stepOnly) {
      this.step = step;
      return;
    }
    this.diary = diary;
    this.step = step;
    this.seq += 1;
    this.scheduleCopy();
    if (this.mode === "edit") {
      this.setState("editing");
      return;
    }
    if (this.holdReason) return;
    window.clearTimeout(this.sendTimer);
    if (this.revision === null && !this.pending && isUntouched(diary)) {
      // 아직 아무것도 쓰지 않은 새 글 — 서버에 만들지 않고 사본도 두지 않는다
      this.savedSeq = this.seq;
      window.clearTimeout(this.copyTimer);
      removeUnsent(this.date);
      this.setState("idle");
      return;
    }
    if (!this.inFlight) this.setState("pending");
    this.sendTimer = window.setTimeout(() => this.pump(), options.immediate ? 0 : SEND_AFTER_MS);
  }

  private scheduleCopy(): void {
    window.clearTimeout(this.copyTimer);
    this.copyTimer = window.setTimeout(() => this.writeCopy(), COPY_AFTER_MS);
  }

  /** 기기 사본을 지금 쓴다(서버가 받지 않은 것이 있을 때만). */
  writeCopy(): void {
    window.clearTimeout(this.copyTimer);
    // 지운 줄은 늦게 온 답이 사본을 되살리지 못하게 한다(로그아웃·지우기 — 마감 검토 M-1)
    if (this.ended || !this.unsent) return;
    writeUnsent({
      v: 1,
      date: this.date,
      mode: this.mode,
      baseRevision: this.pending ? (this.pending.body.revision ?? null) : this.revision,
      diary: this.diary,
      step: this.step,
      pending: this.pending ? { key: this.pending.key, body: this.pending.body } : null,
      savedAt: Date.now()
    });
  }

  /** 화면이 숨는다 — 사본을 바로 쓰고 곧 보낸다. */
  hidden(): void {
    this.writeCopy();
    if (this.mode === "draft") this.pump();
  }

  /** 연결이 돌아왔다·화면이 다시 보인다·잠금이 풀렸다·다시 들어왔다·'다시 시도'를 눌렀다. 충돌은 풀지 않는다. */
  retryNow(): void {
    if (this.ended || this.frozen) return;
    if (this.holdReason === "held") this.holdReason = null;
    window.clearTimeout(this.retryTimer);
    if (this.mode === "draft") this.pump();
  }

  /** 로그인 풀림·잠김·새 버전·날짜 바뀜 — 사본은 두고 보내기만 멈춘다. */
  hold(): void {
    if (this.ended) return;
    this.holdReason = "held";
    window.clearTimeout(this.sendTimer);
    window.clearTimeout(this.retryTimer);
    this.writeCopy();
    this.setState("held");
  }

  /** 되살릴 때 어긋남을 알았다 — 사용자가 고를 때까지 보내지 않는다. */
  markConflict(): void {
    this.holdReason = "conflict";
    this.setState("conflict");
  }

  /** 충돌 시트의 '이 휴대폰의 글로 남기기': 지금 판 번호 위에 새 열쇠로 다시 보낸다. */
  overwriteFrom(currentRevision: number | null): void {
    this.revision = currentRevision;
    this.pending = null;
    this.holdReason = null;
    this.seq += 1;
    this.writeCopy();
    if (this.mode === "draft") this.pump();
    else this.setState("editing");
  }

  /** 날짜가 바뀌어 아직 만들지 않은 새 글을 오늘로 옮긴다(PLAN A-12). */
  retarget(date: string): void {
    removeUnsent(this.date);
    live.delete(this.date);
    this.date = date;
    live.set(date, this);
    this.pending = null;
    this.revision = null;
    this.holdReason = null;
    this.seq += 1;
    this.writeCopy();
    this.pump();
  }

  /** 지금까지의 글을 모두 보낸다. 서버가 다 받으면 true, 그 전에 막히면(끊김·충돌·멈춤·실패) false. */
  flush(): Promise<boolean> {
    if (!this.unsent) return Promise.resolve(true);
    if (this.holdReason === "conflict" || this.mode === "edit") return Promise.resolve(false);
    const done = new Promise<boolean>((resolve) => this.waiters.push(resolve));
    window.clearTimeout(this.sendTimer);
    this.writeCopy();
    if (this.holdReason === "held") this.holdReason = null;
    this.pump();
    return done;
  }

  private settle(ok: boolean): void {
    for (const resolve of this.waiters.splice(0)) resolve(ok);
  }

  /** edit 모드의 '저장하기': 지금 글을 한 번 보낸다. 답(422 incomplete 포함)을 그대로 돌려준다. */
  async saveEdit(): Promise<ApiResult<DiaryMeta>> {
    // 끊겨 답을 받지 못한 앞 요청이 있으면 같은 열쇠·같은 본문으로 먼저 확인하고, 그 뒤에 더 고친 것이 있으면
    // 그 답의 판 번호 위에 새 열쇠로 지금 글을 보낸다 — 모두 받은 뒤에만 성공이다(마감 검토 H-1).
    for (;;) {
      if (!this.pending) this.pending = { key: newRequestKey(), seq: this.seq, body: toInput(this.diary, this.revision, this.step) };
      const sent = this.pending;
      this.writeCopy();
      this.inFlight = true;
      this.setState("saving");
      const result = await this.send(this.date, sent.body, sent.key);
      this.inFlight = false;
      if (this.ended) return result;
      if (result.ok) {
        this.acknowledge(result.data, sent);
        if (this.unsent) continue;
        return result;
      }
      if (result.status === 0 || result.status >= 500) {
        // 같은 열쇠로 다시 누를 수 있게 둔다
        this.setState(result.status === 0 ? "offline" : "failed");
      } else {
        // 받지 않았다(422 incomplete 등) — 열쇠는 버린다(고친 뒤 새 본문이다)
        this.pending = null;
        if (result.status === 409 || result.status === 404) {
          this.holdReason = "conflict";
          this.setState("conflict");
        } else this.setState("editing");
      }
      return result;
    }
  }

  private acknowledge(meta: DiaryMeta, sent: Pending): void {
    this.revision = meta.revision;
    this.savedSeq = Math.max(this.savedSeq, sent.seq);
    this.pending = null;
    this.attempt = 0;
    this.savedAt = Date.now();
    if (this.unsent) {
      this.writeCopy();
      return;
    }
    window.clearTimeout(this.copyTimer);
    removeUnsent(this.date);
    this.setState("saved");
    this.settle(true);
    // 화면이 떠난 뒤 끝까지 보낸 줄은 닫는다
    if (!this.attached) live.delete(this.date);
  }

  private scheduleRetry(): void {
    window.clearTimeout(this.retryTimer);
    if (this.ended) return;
    const wait = RETRY_MS[Math.min(this.attempt, RETRY_MS.length - 1)] ?? 30_000;
    this.attempt += 1;
    this.retryTimer = window.setTimeout(() => {
      if (document.visibilityState === "hidden") return; // 다시 보일 때 retryNow가 부른다
      this.pump();
    }, wait);
  }

  /** 보낼 것이 있으면 하나 보낸다. 끝나면 남은 것을 이어서 보낸다. */
  private async pump(): Promise<void> {
    window.clearTimeout(this.sendTimer);
    if (this.ended || this.frozen || this.inFlight || this.holdReason || this.mode !== "draft") return;
    if (sendingBlocked) {
      this.writeCopy();
      this.setState("held");
      this.settle(false);
      return;
    }
    if (!this.pending) {
      if (!this.unsent) {
        this.settle(true);
        return;
      }
      if (this.revision === null && isUntouched(this.diary)) {
        this.savedSeq = this.seq;
        this.settle(true);
        return;
      }
      this.pending = { key: newRequestKey(), seq: this.seq, body: toInput(this.diary, this.revision, this.step) };
      this.writeCopy();
    }
    const sent = this.pending;
    this.inFlight = true;
    this.setState("saving");
    let result: ApiResult<DiaryMeta>;
    try {
      this.flight = this.send(this.date, sent.body, sent.key);
      result = await this.flight;
    } finally {
      this.inFlight = false;
      this.flight = null;
    }
    if (this.ended) return;
    if (result.ok) {
      this.acknowledge(result.data, sent);
      if (this.unsent && !this.holdReason) this.pump();
      return;
    }
    if (result.status === 0 || result.status >= 500) {
      this.setState(result.status === 0 ? "offline" : "failed");
      this.scheduleRetry();
      this.settle(false);
      return;
    }
    if (result.status === 401 || result.status === 423) {
      // 처리기(lib/api.ts)가 이미 열쇠 화면·잠금 층으로 보냈다 — 같은 요청을 들고 기다린다
      this.hold();
      this.settle(false);
      return;
    }
    if (result.status === 409 && result.code === "revision_conflict") {
      this.holdReason = "conflict";
      this.writeCopy();
      this.setState("conflict");
      this.settle(false);
      this.events.onConflict?.(result.detail?.currentRevision ?? null);
      return;
    }
    if (result.status === 422 && result.code === "not_today" && this.revision === null) {
      this.pending = null;
      this.hold();
      this.settle(false);
      this.events.onNotToday?.();
      return;
    }
    // 같은 열쇠에 다른 본문(idempotency_mismatch)·모양 오류 — 이 요청은 버리고 다음 입력이나 '다시 시도'에 새 열쇠로
    this.pending = null;
    this.setState("failed");
    this.settle(false);
  }

  /** 지우기 전에: 더 보내지 않게 멈추고 날아가는 요청이 끝나기를 기다린다(그 답의 판 번호로 지운다). */
  async quiesce(): Promise<void> {
    // 얼린 동안은 연결 복귀·다시 보임(retryNow)도 보내지 못한다 — 지우기와 저장이 엇갈리지 않게(마감 검토 L-6)
    this.frozen = true;
    window.clearTimeout(this.sendTimer);
    window.clearTimeout(this.retryTimer);
    if (this.flight) await this.flight.catch(() => undefined);
    // pump가 답을 반영할 차례를 한 번 준다
    await Promise.resolve();
  }

  /** 지우기가 되지 않았다 — 얼린 것을 풀고 남은 것을 보낸다. */
  thaw(): void {
    this.frozen = false;
    this.retryNow();
  }

  /** 쓰던 글을 지웠다·고친 내용을 버렸다·로그아웃 — 사본을 지우고 줄을 닫는다. 날아가던 요청의 늦은 답은 무시한다(M-1). */
  discard(): void {
    this.ended = true;
    this.stopForTest();
    removeUnsent(this.date);
    if (live.get(this.date) === this) live.delete(this.date);
  }

  /** 다 보냈으면 줄을 닫는다(화면이 떠날 때 부른다). 남았으면 보낼 때까지 산다. */
  release(): void {
    this.attach(null);
    if (!this.unsent && !this.inFlight) live.delete(this.date);
  }

  stopForTest(): void {
    window.clearTimeout(this.copyTimer);
    window.clearTimeout(this.sendTimer);
    window.clearTimeout(this.retryTimer);
    this.settle(false);
  }
}
