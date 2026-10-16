// 빌드 상수. vite.config.ts의 define이 값을 넣는다(D-115 ④) — 시험은 vitest.config.ts의 client 프로젝트가 넣는다.
declare const __APP_ENV__: "dev" | "prod";
declare const __APP_BUILD__: string;

// CSS는 Vite가 묶는다. 값을 가져오지 않고 불러오기만 한다(side-effect import).
declare module "*.css";
