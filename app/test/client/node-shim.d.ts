// 화면 시험은 DOM 타입만 쓴다(tsconfig.client.json, types: []). 소스 파일을 읽어 대조하는 시험이 쓰는 Node 함수만 선언한다.
declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function readdirSync(path: string, options: { recursive: true }): string[];
}
declare module "node:url" {
  export function fileURLToPath(url: string): string;
}
