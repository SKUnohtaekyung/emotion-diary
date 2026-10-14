/// <reference path="../../client/src/env.d.ts" />
// 새 버전 알림(T3 A-5): 판단만 하고, 새로 고치는 것은 사용자가 띠의 버튼을 누를 때뿐이다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { versionNotice } from "../../client/src/lib/version";
import { fetchSession } from "../../client/src/state";
import { renderVersionBanner } from "../../client/src/ui/banner";
import { flush, mountShell, session, stubFetch } from "./helpers";

describe("versionNotice", () => {
  it("같으면 알리지 않는다", () => {
    expect(versionNotice("b1", 1, "b1", 1)).toBeNull();
  });

  it("빌드가 다르면 '새 버전이 있어요'", () => {
    expect(versionNotice("b2", 1, "b1", 1)).toEqual({ kind: "build", message: "새 버전이 있어요" });
  });

  it("서버의 호환 단계가 화면보다 크면 문구만 '새로 고쳐야 저장할 수 있어요'로 바뀐다", () => {
    expect(versionNotice("b1", 2, "b1", 1)).toEqual({ kind: "compat", message: "새로 고쳐야 저장할 수 있어요" });
    // 빌드도 다르면 호환 단계 쪽이 먼저다
    expect(versionNotice("b2", 2, "b1", 1)?.kind).toBe("compat");
  });

  it("서버 호환 단계가 작거나 같으면 호환 문구를 내지 않는다", () => {
    expect(versionNotice("b1", 1, "b1", 2)).toBeNull();
  });
});

describe("새 버전 띠", () => {
  let reload: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mountShell();
    reload = vi.spyOn(window.location, "reload").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("띠를 그리거나 세션을 다시 확인해도 저절로 새로 고치지 않는다", async () => {
    renderVersionBanner(versionNotice("b2", 1, "test-build", 1));
    const banner = document.getElementById("banner");
    expect(banner?.textContent).toContain("새 버전이 있어요");
    expect(banner?.querySelector("button")?.textContent).toBe("새로 고치기");
    expect(reload).not.toHaveBeenCalled();

    // 화면이 다시 보여 세션을 확인했는데 서버가 더 앞서 있다
    stubFetch(() => session({ build: "b3", compat: 2 }));
    await fetchSession();
    await flush(50);
    expect(banner?.textContent).toContain("새로 고쳐야 저장할 수 있어요");
    expect(reload).not.toHaveBeenCalled();
  });

  it("같은 빌드로 돌아오면 띠가 사라지고, 버튼을 누를 때만 새로 고친다", async () => {
    stubFetch(() => session({ build: "other-build" }));
    await fetchSession();
    const banner = document.getElementById("banner");
    expect(banner?.textContent).toContain("새 버전이 있어요");
    expect(reload).not.toHaveBeenCalled();

    banner?.querySelector("button")?.click();
    expect(reload).toHaveBeenCalledTimes(1);

    stubFetch(() => session({ build: "test-build" }));
    await fetchSession();
    expect(banner?.textContent).toBe("");
  });
});
