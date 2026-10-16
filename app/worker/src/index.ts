// Worker 진입점. 빌드 상수는 wrangler.jsonc의 define(환경별)과 app/scripts/build.mjs의 --define이 넣는다.
// 개발용 전용 경로는 여기서만 붙인다 — __APP_ENV__가 prod면 아래 조건이 빌드 때 false로 접혀 dev/ 코드가 묶음에서 빠진다(D-115 ②).
import type { AppEnvName } from "../../shared/api";
import { createApp } from "./app";
import type { Bindings } from "./context";
import { devRoutes } from "./dev/clientErrors";

declare const __APP_ENV__: AppEnvName;
declare const __APP_BUILD__: string;

const app = createApp({
  appEnv: __APP_ENV__,
  build: __APP_BUILD__,
  devRoutes: __APP_ENV__ !== "prod" ? devRoutes() : undefined
});

export default {
  fetch: (request, env) => app.fetch(request, env)
} satisfies ExportedHandler<Bindings>;
