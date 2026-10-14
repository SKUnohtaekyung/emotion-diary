// 개발용 오류 보고를 정리한다(D-113 ②, T3 A-6). 서버에 남기는 것은 일곱 칸뿐이다 — 메시지·stack·입력값은 읽지도 않는다.
// 정리의 안전 규칙은 운영의 오류 번호 화면과 같은 lib/errorInfo를 쓰고, 마지막으로 서버와 같은 검사(parseClientError)를 한 번 더 한다.
// 이 폴더는 운영 묶음에 들어가지 않는다 — main.ts가 개발용일 때만 동적으로 불러온다.

import { type ClientErrorReport, parseClientError } from "../../../shared/dev";
import { type ErrorLike, errorParts, reportRouteOf, safeBuild } from "../lib/errorInfo";

/**
 * 화면 오류를 보고 한 건으로 정리한다. 이름은 error.name이 안전한 모양이면 그대로 아니면 'Error', 파일은 경로만(query·# 버림,
 * 다른 출처는 '/external'), 줄·칸은 ErrorEvent의 값(없으면 0), route는 화면 이름만(query와 날짜 같은 값 조각 버림).
 * 검사를 통과하지 못하면 null — 보내지 않는다.
 */
export function toReport(error: ErrorLike, route: string, build: string): ClientErrorReport | null {
  const parts = errorParts(error);
  return parseClientError({
    kind: parts.kind,
    name: parts.name,
    source: parts.source,
    line: parts.line,
    col: parts.col,
    build: safeBuild(build),
    route: reportRouteOf(route)
  });
}

/** 실패한 API 응답을 보고 한 건으로. 상태 번호와 API 경로뿐이다(본문은 읽지 않는다). */
export function apiReport(path: string, status: number, route: string, build: string): ClientErrorReport | null {
  return parseClientError({
    kind: "api",
    name: `HTTP${status}`,
    source: path.split(/[?#]/)[0] ?? path,
    line: 0,
    col: 0,
    build: safeBuild(build),
    route: reportRouteOf(route)
  });
}
