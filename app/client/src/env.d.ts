// 빌드 상수. vite.config.ts의 define이 값을 넣는다(D-115 ④) — 시험은 vitest.config.ts의 client 프로젝트가 넣는다.
declare const __APP_ENV__: "dev" | "prod";
declare const __APP_BUILD__: string;

// CSS는 Vite가 묶는다. 값을 가져오지 않고 불러오기만 한다(side-effect import).
declare module "*.css";

// Vite의 import.meta.glob(eager URL 가져오기) — lib/art.ts가 그림 파일 주소를 묶을 때 쓴다(TASK-REFLECT-01 R-1).
// vite/client 타입 전체를 들이지 않고 쓰는 모양 하나만 적는다.
interface ImportMeta {
  glob(pattern: string, options: { eager: true; query: "?url"; import: "default" }): Record<string, string>;
}
