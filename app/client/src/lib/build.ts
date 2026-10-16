// 빌드 상수를 한 곳에서 받는다. vite.config.ts의 define(시험은 vitest.config.ts)이 값을 넣고 env.d.ts가 타입을 선언한다.
// Biome에는 biome.json의 javascript.globals로 두 상수를 알린다.
// 운영 묶음에서 개발용 코드를 빼는 조건(main.ts)만 상수를 그대로 쓴다 — 묶음 도구가 조건을 접어야 하기 때문이다.

export const APP_BUILD: string = __APP_BUILD__;
export const APP_ENV: "dev" | "prod" = __APP_ENV__;
