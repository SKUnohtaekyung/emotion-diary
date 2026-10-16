// 요청이 실패했을 때 화면이 보일 말. 탓하지 않고, 지금 할 수 있는 것을 말한다(UX_SPEC §6.1).

import { PIN_REST_MS } from "../../../shared/api";
import type { ApiFail } from "../lib/api";

export function failureMessage(failure: ApiFail): string {
  if (failure.offline) return "인터넷에 연결되면 할 수 있어요.";
  if (failure.status === 429) return `잠시 쉬었다가 다시 눌러요. ${Math.ceil(failure.retryAfter ?? PIN_REST_MS / 1000)}초`;
  return "지금은 할 수 없어요. 잠시 뒤 다시 시도해 주세요.";
}
