// 접근 열쇠와 서버 비밀값을 만든다 — 값은 Git 제외 파일에만 쓰고 화면·로그에 찍지 않는다(ARCHITECTURE §3, D-115 ①).
//   node app/scripts/make-secrets.mjs <local|dev> all [--key-length N]   비밀값 넷과 열쇠를 새로 만든다
//   node app/scripts/make-secrets.mjs <local|dev> key [--key-length N]   열쇠(와 그 salt·해시)만 바꾼다 — 세션 서명·잠금 비밀값은 그대로
//   node app/scripts/make-secrets.mjs <local|dev> backup                 PC 백업 토큰을 새로 만든다(D-109) — 서버에는 SHA-256 해시(BACKUP_TOKEN_HASH)만,
//                                                                         토큰은 work/deploy/<env>.BACKUP-TOKEN.txt에만. 다른 비밀값은 그대로
// 결과:
//   local → .dev.vars(wrangler dev가 읽는다) + work/deploy/local.PHONE-KEY.txt
//   dev   → work/deploy/dev.secrets.env(app/scripts/cf.mjs dev secrets가 올린다) + work/deploy/dev.PHONE-KEY.txt
// 열쇠 파일은 휴대폰에 넣을 때만 연다. 채팅·문서·캡처에 옮기지 않는다.
import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [envName, what = "all", ...flags] = process.argv.slice(2);
if (!["local", "dev"].includes(envName ?? "") || !["all", "key", "backup"].includes(what)) {
  console.error("사용법: node app/scripts/make-secrets.mjs <local|dev> <all|key|backup> [--key-length N]");
  process.exit(2);
}
const lengthFlag = flags.indexOf("--key-length");
const keyLength = lengthFlag >= 0 ? Number(flags[lengthFlag + 1]) : 43;
if (!Number.isInteger(keyLength) || keyLength < 12 || keyLength > 128) {
  console.error("--key-length는 12~128");
  process.exit(2);
}

// 휴대폰에서 손으로 넣기 쉽게 헷갈리는 글자(0·O·1·l·I)를 뺀 문자 집합. 12자여도 약 70비트다.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const randomKey = (length) => Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const secret = () => randomBytes(32).toString("base64url");

const deployDir = path.join(root, "work", "deploy");
mkdirSync(deployDir, { recursive: true });
const secretsFile = envName === "local" ? path.join(root, ".dev.vars") : path.join(deployDir, `${envName}.secrets.env`);
const keyFile = path.join(deployDir, `${envName}.PHONE-KEY.txt`);

const previous = existsSync(secretsFile)
  ? Object.fromEntries(readFileSync(secretsFile, "utf8").split(/\r?\n/).filter((line) => line.includes("=")).map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]))
  : {};
if ((what === "key" || what === "backup") && (!previous.SESSION_SECRET || !previous.APP_LOCK_SECRET)) {
  console.error("기존 비밀값 파일이 없다 — 먼저 all로 만든다");
  process.exit(1);
}

const writeSecrets = (values) =>
  writeFileSync(secretsFile, `${Object.entries(values).map(([name, value]) => `${name}=${value}`).join("\n")}\n`, { mode: 0o600 });

if (what === "backup") {
  // 토큰은 32바이트 무작위(base64url 43자 — 서버의 Bearer 모양 검사와 같다). 높은 엔트로피라 salt 없는 SHA-256으로 충분하다.
  const token = randomBytes(32).toString("base64url");
  const tokenFile = path.join(deployDir, `${envName}.BACKUP-TOKEN.txt`);
  writeSecrets({ ...previous, BACKUP_TOKEN_HASH: createHash("sha256").update(token).digest("hex") });
  writeFileSync(tokenFile, `${token}\n`, { mode: 0o600 });
  console.info(`만들었다(값은 찍지 않는다): ${path.relative(root, secretsFile)}의 BACKUP_TOKEN_HASH, ${path.relative(root, tokenFile)}`);
  if (envName === "dev") console.info("다음: node app/scripts/cf.mjs dev secrets BACKUP_TOKEN_HASH(또는 deploy) — 그 뒤 node app/scripts/backup.mjs pull dev");
  process.exit(0);
}

const key = randomKey(keyLength);
const salt = secret();
const values = {
  ACCESS_KEY_HASH: createHmac("sha256", salt).update(key).digest("hex"),
  ACCESS_KEY_SALT: salt,
  SESSION_SECRET: what === "all" ? secret() : previous.SESSION_SECRET,
  APP_LOCK_SECRET: what === "all" ? secret() : previous.APP_LOCK_SECRET,
  // 백업 토큰은 열쇠와 따로 돈다 — 있으면 그대로 둔다
  ...(previous.BACKUP_TOKEN_HASH ? { BACKUP_TOKEN_HASH: previous.BACKUP_TOKEN_HASH } : {})
};

writeSecrets(values);
writeFileSync(keyFile, `${key}\n`, { mode: 0o600 });
console.info(`만들었다(값은 찍지 않는다): ${path.relative(root, secretsFile)}, ${path.relative(root, keyFile)} — 열쇠 ${keyLength}자`);
if (envName === "dev") console.info("다음: node app/scripts/cf.mjs dev deploy(비밀값 파일을 함께 올린다) — 올린 뒤 비밀값만 바꿀 때는 cf.mjs dev secrets");
