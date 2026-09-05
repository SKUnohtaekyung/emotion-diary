// taxonomy 데이터 검사기 (TASK-TAXONOMY §9.3, TASK-TAXONOMY-PLAN-V2 §3·§4·§10)
//
// 두 층으로 검사한다.
//  1. 구조 — schemas/taxonomy.schema.json 대조. 저장소에 의존성이 없으므로
//     그 schema가 실제로 쓰는 키워드 부분집합만 다루는 validator를 여기 둔다.
//  2. 의미 — 등급 도출 규칙, A 완전성, C 비율, 계열 근거 편수, v1→v2 매핑 누락,
//     D-022 code 규칙, 인용 15단어(§6.4).
//
// data/taxonomy/가 없으면 pending으로 통과한다(check-characters.mjs와 같은 방식).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const failures = [];
const notes = [];

// PLAN-V2 §3 등급 도출 표. writer가 판단하지 않고 (확인 수준, 근거 유형)에서 결정된다.
const GRADE_TABLE = {
  V1: { L1: "A", L2: "B+", L3: "C", L4: "C" },
  V2: { L1: "B", L2: "C", L3: "C", L4: "C" }
};
const GRADE_ORDER = ["A", "B+", "B", "C"]; // 강한 순서. category_grade 도출(2번째로 강한 등급)에 쓴다.
const LEVEL_ORDER = ["L1", "L2", "L3", "L4"]; // 강한 순서(인덱스가 작을수록 강함). evidence_level 천장 규칙(변경 1)에 쓴다.
const C_RATIO_MAX = 0.15; // §7.1(D) 사용자 승인값. 보조 검사다 — 주 통제는 A 완전성이다.
const QUOTE_WORD_MAX = 15; // §6.4 라이선스 규칙
// 레드팀 결함 2 수정 — 규모 검사 하한. 계열 하나가 색·캐릭터 자산을 점유하는데 선택지가
// 이 값 미만이면 제품상 계열로 성립하기 어렵다. 손선주 외(2012) 실측(한국어 감정 어휘의
// 약 6%가 혐오)으로 194개 규모를 환산하면 계열당 기대치는 약 12개다 — 5는 그 기대치에
// 크게 못 미치는 최소 방어선이다.
const MIN_CATEGORY_SIZE = 5;

// ---------------------------------------------------------------- schema subset

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function matchesType(value, expected) {
  const actual = typeOf(value);
  if (expected === "number") return actual === "integer" || actual === "number";
  if (expected === "integer") return actual === "integer";
  return actual === expected;
}

function resolveRef(ref, schemaRoot) {
  if (!ref.startsWith("#/")) throw new Error(`지원하지 않는 $ref: ${ref}`);
  let node = schemaRoot;
  for (const segment of ref.slice(2).split("/")) node = node?.[segment];
  if (!node) throw new Error(`찾을 수 없는 $ref: ${ref}`);
  return node;
}

function validate(value, schema, schemaRoot, pointer, errors) {
  if (schema.$ref) return validate(value, resolveRef(schema.$ref, schemaRoot), schemaRoot, pointer, errors);

  if (schema.oneOf) {
    const passing = schema.oneOf.filter((option) => {
      const sub = [];
      validate(value, option, schemaRoot, pointer, sub);
      return sub.length === 0;
    });
    if (passing.length !== 1) errors.push(`${pointer}: oneOf 분기 ${passing.length}개 통과(정확히 1개여야 한다)`);
    return;
  }

  if (schema.type !== undefined) {
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expected.some((candidate) => matchesType(value, candidate))) {
      errors.push(`${pointer}: type 불일치 — ${expected.join("|")} 이어야 하는데 ${typeOf(value)}`);
      return;
    }
  }
  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${pointer}: const 불일치 — "${schema.const}" 이어야 하는데 ${JSON.stringify(value)}`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${pointer}: enum 위반 — ${JSON.stringify(value)} 은 [${schema.enum.join(", ")}] 에 없다`);
  }

  if (typeof value === "string") {
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(value)) {
      errors.push(`${pointer}: pattern 위반 — ${JSON.stringify(value)} 이 /${schema.pattern}/ 에 맞지 않는다`);
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${pointer}: 너무 짧다(최소 ${schema.minLength})`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${pointer}: 너무 길다(최대 ${schema.maxLength})`);
  }

  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${pointer}: minimum 위반(최소 ${schema.minimum})`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${pointer}: 항목이 부족하다(최소 ${schema.minItems}, 실제 ${value.length})`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${pointer}: 항목이 너무 많다(최대 ${schema.maxItems}, 실제 ${value.length})`);
    if (schema.uniqueItems) {
      const seen = new Set();
      for (const item of value) {
        const key = JSON.stringify(item);
        if (seen.has(key)) { errors.push(`${pointer}: uniqueItems 위반 — 중복 ${key}`); break; }
        seen.add(key);
      }
    }
    if (schema.items) value.forEach((item, index) => validate(item, schema.items, schemaRoot, `${pointer}[${index}]`, errors));
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(`${pointer}: 필수 속성 누락 — ${key}`);
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(schema.properties, key)) errors.push(`${pointer}: 알 수 없는 속성 — ${key}`);
      }
    }
    // additionalProperties가 값 schema(객체)인 경우 — properties에 없는 키를 그 schema로
    // 검사한다. 임의 키를 허용하되 값 형태는 강제할 때 쓴다(예: evidence_catalog).
    // additionalProperties: false 의 기존 동작(위 블록)은 건드리지 않는다.
    if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(schema.properties ?? {}, key)) {
          validate(value[key], schema.additionalProperties, schemaRoot, `${pointer}.${key}`, errors);
        }
      }
    }
    // propertyNames — 키 자체를 문자열 값으로 취급해 검사한다(예: pattern으로 evidence_ref
    // 형식을 강제). evidence_catalog처럼 키가 임의이지만 형식은 고정인 경우에 쓴다.
    if (schema.propertyNames) {
      for (const key of Object.keys(value)) {
        validate(key, schema.propertyNames, schemaRoot, `${pointer}[키:${key}]`, errors);
      }
    }
    for (const [key, subSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validate(value[key], subSchema, schemaRoot, `${pointer}.${key}`, errors);
      }
    }
  }
}

function validateAgainst(data, defName, schemaRoot, label) {
  const errors = [];
  validate(data, { $ref: `#/$defs/${defName}` }, schemaRoot, label, errors);
  for (const error of errors) failures.push(`schema: ${error}`);
  return errors.length === 0;
}

// ---------------------------------------------------------------- load

const taxonomyDir = path.join(root, "data/taxonomy");
if (!fs.existsSync(taxonomyDir)) {
  console.log("PENDING: data/taxonomy/ 없음 — taxonomy 검사를 건너뛴다");
  process.exit(0);
}

const schemaPath = path.join(root, "schemas/taxonomy.schema.json");
if (!fs.existsSync(schemaPath)) {
  console.error("FAIL: schemas/taxonomy.schema.json 이 없다");
  process.exit(1);
}
const schemaRoot = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

function readJson(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return null;
  try { return JSON.parse(fs.readFileSync(absolute, "utf8")); }
  catch (error) { failures.push(`JSON 구문 오류: ${relative}: ${error.message}`); return null; }
}

const v1 = readJson("data/taxonomy/v1.json");
const v2 = readJson("data/taxonomy/v2.json");
const map = readJson("data/taxonomy/v1-to-v2.json");

// ---------------------------------------------------------------- v1

const v1Codes = new Set();
if (v1) {
  validateAgainst(v1, "taxonomyV1", schemaRoot, "v1.json");
  for (const category of v1.categories ?? []) {
    for (const emotion of category.emotions ?? []) {
      // D-022: code는 카테고리별 독립 발급이며 접두어가 카테고리 code와 같아야 한다.
      if (!emotion.code.startsWith(`${category.code}-`)) {
        failures.push(`v1 D-022 접두어 불일치: ${emotion.code} 가 카테고리 ${category.code} 안에 있다`);
      }
      if (v1Codes.has(emotion.code)) failures.push(`v1 중복 emotion_code: ${emotion.code}`);
      v1Codes.add(emotion.code);
    }
  }
  // 검수 상태와 review 블록의 정합 — D-027은 시간 분리 2회 또는 사용자 최종 대조를 요구한다.
  if (v1.review_status === "reviewed") {
    const timeSeparated = Boolean(v1.review?.first_pass_date && v1.review?.second_pass_date);
    const userChecked = Boolean(v1.review?.user_cross_check_by && v1.review?.user_cross_check_date);
    if (!timeSeparated && !userChecked) {
      failures.push("v1 review_status=reviewed 인데 D-027 검수 증거가 없다(시간 분리 2회 또는 사용자 최종 대조)");
    }
  }
  notes.push(`v1: ${v1.categories?.length ?? 0}계열 ${v1Codes.size}개, review_status=${v1.review_status}`);
}

// ---------------------------------------------------------------- v2

const v2Codes = new Set();
if (v2) {
  validateAgainst(v2, "taxonomyV2", schemaRoot, "v2.json");

  // 변경 1 — evidence_catalog: evidence_ref마다 실제 확인 수준을 한 번만 선언하는 표.
  // schema가 required로 강제하지만 "최소 1개"는 propertyNames/additionalProperties 값
  // schema만으로 표현할 수 없다(빈 객체 {}도 구조상 통과한다) — 여기서 기수를 직접 본다.
  const catalog = v2.evidence_catalog ?? {};
  if (v2.evidence_catalog && Object.keys(v2.evidence_catalog).length === 0) {
    failures.push("v2 evidence_catalog 가 비어 있다(최소 1개 필요)");
  }

  const fulltext = new Set(v2.fulltext_sources ?? []);

  // 변경 3a — fulltext_sources는 카탈로그의 L1 부분집합과 정확히 일치해야 한다.
  // 구멍1의 절반: 지금까지 이 목록은 카탈로그 없이 항목의 자기 신고만으로 대조됐다.
  for (const [ref, entry] of Object.entries(catalog)) {
    if (entry?.evidence_level === "L1" && !fulltext.has(ref)) {
      failures.push(`v2 fulltext_sources 누락: ${ref} 는 카탈로그에서 L1 이다`);
    }
  }
  for (const ref of fulltext) {
    const level = catalog[ref]?.evidence_level;
    if (level !== "L1") {
      failures.push(`v2 fulltext_sources 에 L1 이 아닌 출처가 있다: ${ref} (카탈로그=${level ?? "없음"})`);
    }
  }

  let total = 0;
  let cCount = 0;
  let aCount = 0;
  let bPlusCount = 0; // 등급 분포 note용(아카이브 변경 4).
  let bCount = 0;
  let downgradeCount = 0; // 변경 5 — 카탈로그보다 약한 evidence_level을 쓴 항목 수(요약 note용).
  const gradeLoweredBuckets = new Map(); // 변경 5 — 위 하향 중 evidence_grade까지 실제로 낮아진 건, 결과 등급별 집계.

  for (const category of v2.categories ?? []) {
    // §7.1(B) 계열 근거 2편, PLAN-V2 §4. 레드팀 결함 1 수정 — shortfall_note_ko 요구를
    // 편수에만 걸면 "근거는 2편이지만 둘 다 약해 category_grade가 C/B로 떨어지는" 계열이
    // 설명할 자리를 잃는다(가장 설명이 필요한 계열인데 조건 충족으로 오히려 막힌다).
    // 편수가 미달이거나 등급 자체가 약할 때(C 또는 B)를 "설명이 필요한 상태"로 보고 그
    // 경우에만 필수로 삼는다. 반대로 충분할 때(refs 2편 이상 그리고 등급 A 또는 B+)는
    // 여전히 금지 — 편수 기준 하나만으로 걸던 기존 조건을 대체한다.
    const refs = category.category_evidence_refs ?? [];
    const gradeIsWeak = category.category_grade === "C" || category.category_grade === "B";
    const explanationNeeded = refs.length < 2 || gradeIsWeak;
    if (explanationNeeded && !category.shortfall_note_ko) {
      failures.push(`v2 계열 근거가 약한데 shortfall_note_ko 가 없다: ${category.code} (refs ${refs.length}편, grade ${category.category_grade})`);
    }
    if (!explanationNeeded && category.shortfall_note_ko) {
      failures.push(`v2 계열 근거가 충분한데 shortfall_note_ko 가 있다: ${category.code} (refs ${refs.length}편, grade ${category.category_grade})`);
    }

    // 변경 3b — category_grade는 판단이 아니라 도출이다(구멍1의 나머지 절반).
    // refs 각각을 카탈로그의 (verification, evidence_level)로 GRADE_TABLE 등급화하고
    // 강한 순서(A > B+ > B > C)로 정렬한 뒤 2번째로 강한 등급을 쓴다 — §7.1(B)가 독립
    // 문헌 2편을 요구하므로 계열의 실질 강도는 두 번째 출처가 결정한다는 판단이다.
    const categoryGrades = [];
    for (const ref of refs) {
      const entry = catalog[ref];
      if (!entry) {
        failures.push(`v2 계열 근거 ref 가 카탈로그에 없다: ${category.code} -> ${ref}`);
        continue;
      }
      const grade = GRADE_TABLE[entry.verification]?.[entry.evidence_level];
      if (grade) categoryGrades.push(grade);
    }
    categoryGrades.sort((a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b));
    let expectedCategoryGrade = "C";
    if (categoryGrades.length === 1) expectedCategoryGrade = categoryGrades[0];
    else if (categoryGrades.length >= 2) expectedCategoryGrade = categoryGrades[1];
    if (category.category_grade !== expectedCategoryGrade) {
      failures.push(`v2 계열 등급 도출 위반: ${category.code} 는 ${refs.join(", ")} 에서 ${expectedCategoryGrade} 이어야 하는데 ${category.category_grade}`);
    }

    for (const emotion of category.emotions ?? []) {
      total += 1;
      if (!emotion.code.startsWith(`${category.code}-`)) {
        failures.push(`v2 D-022 접두어 불일치: ${emotion.code} 가 카테고리 ${category.code} 안에 있다`);
      }
      if (v2Codes.has(emotion.code)) failures.push(`v2 중복 emotion_code: ${emotion.code}`);
      v2Codes.add(emotion.code);

      // 아카이브 계층(PR-004 원자료 보존, 아카이브 변경 1) — source=raw && evidence_level=L4
      // 인 항목은 v1 원자료를 계열 변경 없이 그대로 옮긴 것이라 문헌 근거가 없는 것 자체가
      // 결함이 아니다. 유지는 주장이 아니므로(PR-004가 v1 배치를 기본값으로 둔다) 문헌
      // 근거를 요구하지 않고 GRADE_TABLE의 L4 칸(C)을 덮어써 B로 고정한다. 반대로 이동은
      // 주장이므로 근거가 필요하다 — 아래 아카이브 변경 2에서 매핑표 action이 실제로
      // keep인지 교차 검사해 "이동해 놓고 유지라고 적어 B를 받는" 회피를 막는다.
      // 아래의 번호 없는(또는 "변경 N") 주석은 이 파일에 이미 있던 카탈로그 대조 로직이며
      // 이 작업과 무관하다 — "아카이브 변경 N"만 이번 작업(PM 지시서) 소관이다.
      const isArchiveTier = emotion.source === "raw" && emotion.evidence_level === "L4";

      // PLAN-V2 §3: 등급은 판단이 아니라 도출이다. 아카이브 계층은 표를 우회한다(아카이브 변경 1).
      const expected = isArchiveTier ? "B" : GRADE_TABLE[emotion.verification]?.[emotion.evidence_level];
      if (expected && emotion.evidence_grade !== expected) {
        failures.push(
          isArchiveTier
            ? `v2 아카이브 등급 위반: ${emotion.code} 는 원자료 보존(raw+L4)이므로 B 여야 하는데 ${emotion.evidence_grade}`
            : `v2 등급 도출 위반: ${emotion.code} 는 (${emotion.verification}, ${emotion.evidence_level}) → ${expected} 여야 하는데 ${emotion.evidence_grade}`
        );
      }
      if (emotion.evidence_grade === "C") cCount += 1;
      if (emotion.evidence_grade === "A") aCount += 1;
      if (emotion.evidence_grade === "B+") bPlusCount += 1;
      if (emotion.evidence_grade === "B") bCount += 1;

      // L4(문헌 근거 없음)가 아니면 근거 참조가 있어야 한다.
      if (emotion.evidence_level !== "L4" && !emotion.evidence_ref) {
        failures.push(`v2 근거 참조 누락: ${emotion.code} (evidence_level=${emotion.evidence_level})`);
      }
      // 반대로 L4인데 참조가 붙어 있으면 등급이 잘못 낮춰졌거나 참조가 잘못됐다.
      if (emotion.evidence_level === "L4" && emotion.evidence_ref) {
        failures.push(`v2 L4 인데 evidence_ref 가 있다: ${emotion.code}`);
      }
      // 아카이브 변경 2(첫 번째) — 아카이브 계층은 evidence_ref가 없어(위 검사) 카탈로그와
      // 대조할 수 없으므로 level_downgrade_reason 도 있을 수 없다(대조할 카탈로그 값이 없다).
      if (isArchiveTier && emotion.level_downgrade_reason) {
        failures.push(`v2 L4 항목에 level_downgrade_reason 이 있다: ${emotion.code} (대조할 카탈로그 값이 없다)`);
      }
      // 아카이브 변경 2(두 번째, 가장 중요) — "이동해 놓고 유지라고 적어 B를 받는" 것을
      // 막는다. 매핑표가 로드된 경우, 이 항목의 v2_code를 가리키는 매핑 행이 정확히 1개
      // 이고 그 action이 keep이어야 한다. v1-to-v2.json과 교차 검사해야만 막을 수 있다.
      if (isArchiveTier && map) {
        const mappingRows = (map.mappings ?? []).filter((row) => row.v2_code === emotion.code);
        if (mappingRows.length !== 1 || mappingRows[0].action !== "keep") {
          const actionList = mappingRows.map((row) => row.action).join(", ");
          failures.push(`v2 아카이브 등급인데 매핑이 keep 이 아니다: ${emotion.code} (행 ${mappingRows.length}개, action=${actionList})`);
        }
      }
      // 아카이브 변경 3 — source가 literature/korean_lexicon 이라고 적어 놓고
      // evidence_level이 L4(문헌 근거 없음)이면 자기모순이다. 문헌에서 왔다면서 문헌
      // 근거가 없을 수 없다.
      if ((emotion.source === "literature" || emotion.source === "korean_lexicon") && emotion.evidence_level === "L4") {
        failures.push(`v2 문헌 출처인데 근거 수준이 L4 다: ${emotion.code} (source=${emotion.source})`);
      }

      // 변경 2 — 항목의 주장(evidence_level·verification)을 카탈로그의 실제 확인
      // 수준과 대조한다(구멍2: 지금까지 이 값들은 그 무엇과도 대조되지 않았다).
      // L4는 evidence_ref가 없으므로(위 검사) 이 대조를 자연히 건너뛴다.
      if (emotion.evidence_ref) {
        const catalogEntry = catalog[emotion.evidence_ref];
        if (!catalogEntry) {
          failures.push(`v2 evidence_ref 가 카탈로그에 없다: ${emotion.code} -> ${emotion.evidence_ref}`);
        } else {
          // 변경 1 — evidence_level은 카탈로그를 천장으로 삼는다("같거나 더 약해야" 한다).
          // 출처의 확인 수준(카탈로그)과 그 출처가 "이 항목"을 뒷받침하는 강도(항목의 주장)는
          // 다른 것이다 — 강한 출처를 인용한다고 항목까지 강제로 끌어올리면 과잉 주장이
          // 된다(예: 범주 층위는 지지하지만 개별 어휘 귀속은 지지하지 않는 문헌).
          const itemStrength = LEVEL_ORDER.indexOf(emotion.evidence_level);
          const catalogStrength = LEVEL_ORDER.indexOf(catalogEntry.evidence_level);
          if (itemStrength < catalogStrength) {
            failures.push(`v2 evidence_level 과잉 주장: ${emotion.code} -> ${emotion.evidence_ref} 항목=${emotion.evidence_level} 카탈로그=${catalogEntry.evidence_level} (카탈로그보다 강할 수 없다)`);
          } else if (itemStrength > catalogStrength) {
            // 변경 2 — 하향 자체는 정당할 수 있다(§ 위 설명). 다만 조용히 일어나면 안 되므로
            // 사유를 강제해 눈에 보이게 만든다.
            downgradeCount += 1;
            if (!emotion.level_downgrade_reason) {
              failures.push(`v2 등급 하향 사유 없음: ${emotion.code} -> ${emotion.evidence_ref} (카탈로그 ${catalogEntry.evidence_level} → 항목 ${emotion.evidence_level})`);
            }
            // 하향이 실제 evidence_grade까지 낮추는지 집계(변경 5 요약 note용). L3->L4처럼
            // GRADE_TABLE에서 같은 칸에 떨어지는 하향은 등급 자체는 그대로일 수 있다.
            const catalogImpliedGrade = GRADE_TABLE[catalogEntry.verification]?.[catalogEntry.evidence_level];
            const actualGrade = GRADE_TABLE[emotion.verification]?.[emotion.evidence_level];
            if (catalogImpliedGrade && actualGrade && catalogImpliedGrade !== actualGrade) {
              gradeLoweredBuckets.set(actualGrade, (gradeLoweredBuckets.get(actualGrade) ?? 0) + 1);
            }
          } else if (emotion.level_downgrade_reason) {
            // 변경 2 반대 방향 — 하향이 아닌데 사유가 달려 있으면 그 자체가 데이터 오류다.
            failures.push(`v2 하향이 아닌데 level_downgrade_reason 이 있다: ${emotion.code}`);
          }

          // 변경 3 — verification은 판단이 아니라 사실(writer가 원문을 재확인했는가)이므로
          // 항목별로 달라질 수 없다. 정확 일치 검사를 그대로 둔다.
          if (emotion.verification !== catalogEntry.verification) {
            failures.push(`v2 verification 이 카탈로그와 다르다: ${emotion.code} -> ${emotion.evidence_ref} 항목=${emotion.verification} 카탈로그=${catalogEntry.verification}`);
          }
        }
      }

      // 변경 4 — A 완전성 조건의 방향을 뒤집는다. "카탈로그가 L1이면 항목도 L1이어야
      // 한다"는 변경 1의 천장 규칙과 정면 충돌하는 옛 규칙이라 제거했다. 대신 "항목이
      // L1을 주장하면 그 evidence_ref는 실제로 전문 확보 출처여야 한다"만 강제한다 —
      // 과잉 주장을 막는 목적은 유지하되 정당한 하향은 막지 않는다.
      if (emotion.evidence_level === "L1" && emotion.evidence_ref && !fulltext.has(emotion.evidence_ref)) {
        failures.push(`v2 L1 주장인데 전문 확보 출처가 아니다: ${emotion.code} -> ${emotion.evidence_ref}`);
      }

      // D-022 복수 배치는 실재하는 다른 계열 code를 가리켜야 한다(존재 검사는 아래에서).
      for (const alias of emotion.also_in ?? []) {
        if (alias === emotion.code) failures.push(`v2 also_in 이 자기 자신을 가리킨다: ${emotion.code}`);
      }
    }
  }

  for (const category of v2.categories ?? []) {
    for (const emotion of category.emotions ?? []) {
      for (const alias of emotion.also_in ?? []) {
        if (!v2Codes.has(alias)) failures.push(`v2 also_in 이 실재하지 않는 code 를 가리킨다: ${emotion.code} -> ${alias}`);
      }
    }
  }

  // 검수 상태와 review 블록의 정합 — D-027은 시간 분리 2회 또는 사용자 최종 대조를 요구한다.
  // v1과 동일한 요구이지만 v2 섹션에는 이 검사가 없어 review_status=reviewed 이면서
  // review 6개 필드가 전부 null이어도 통과하는 구멍이 있었다(v1 쪽 검사는 195행 부근 참고).
  if (v2.review_status === "reviewed") {
    const timeSeparated = Boolean(v2.review?.first_pass_date && v2.review?.second_pass_date);
    const userChecked = Boolean(v2.review?.user_cross_check_by && v2.review?.user_cross_check_date);
    if (!timeSeparated && !userChecked) {
      failures.push("v2 review_status=reviewed 인데 D-027 검수 증거가 없다(시간 분리 2회 또는 사용자 최종 대조)");
    }
  }

  if (total > 0) {
    const ratio = cCount / total;
    if (ratio > C_RATIO_MAX) {
      failures.push(`v2 C등급 비율 초과: ${(ratio * 100).toFixed(1)}% (상한 ${(C_RATIO_MAX * 100).toFixed(0)}%, ${cCount}/${total})`);
    }
    notes.push(`v2: ${v2.categories.length}계열 ${total}개 — A ${aCount} / C ${cCount} (${(cCount / total * 100).toFixed(1)}%)`);
    if (aCount === 0) {
      notes.push("v2: A등급 0건 — 전문(full text) 확보 문헌이 없다는 뜻이다(PLAN-V2 §3)");
    }
    // 아카이브 변경 4 — 등급 분포 요약(아카이브 계층 신설로 B 칸이 다시 쓰이므로 분포를 눈에 보이게 한다).
    notes.push(`등급 분포: A ${aCount}건 / B+ ${bPlusCount}건 / B ${bCount}건 / C ${cCount}건 (총 ${total}건, C 비율 ${(cCount / total * 100).toFixed(1)}%)`);
  }

  // 변경 5 — 하향이 몇 건이고 그중 evidence_grade까지 실제로 낮아진 건 몇 건인지 요약한다.
  // 하향 자체가 0건이면(즉 아무도 카탈로그보다 약한 값을 쓰지 않았으면) 줄을 내지 않는다.
  if (downgradeCount > 0) {
    const gradeLoweredTotal = [...gradeLoweredBuckets.values()].reduce((sum, n) => sum + n, 0);
    const detail = gradeLoweredTotal > 0
      ? GRADE_ORDER.filter((grade) => gradeLoweredBuckets.has(grade)).map((grade) => `${grade} 등급 ${gradeLoweredBuckets.get(grade)}건`).join(", ")
      : "등급 변화 0건";
    notes.push(`등급 하향 ${downgradeCount}건(카탈로그 대비), 그 결과 ${detail}`);
  }
}

// ---------------------------------------------------------------- v1 -> v2 매핑

if (map) {
  validateAgainst(map, "migrationMap", schemaRoot, "v1-to-v2.json");

  const handled = new Map();
  for (const row of map.mappings ?? []) {
    // action 과 code 존재의 정합
    if (row.action === "add" && row.v1_code !== null) failures.push(`매핑 action=add 인데 v1_code 가 있다: ${row.v2_code}`);
    if (row.action !== "add" && row.v1_code === null) failures.push(`매핑 action=${row.action} 인데 v1_code 가 null 이다: ${row.v2_code}`);
    if (row.action === "drop" && row.v2_code !== null) failures.push(`매핑 action=drop 인데 v2_code 가 있다: ${row.v1_code}`);
    if (row.action !== "drop" && row.v2_code === null) failures.push(`매핑 action=${row.action} 인데 v2_code 가 null 이다: ${row.v1_code}`);

    if (row.v1_code !== null) {
      if (v1 && !v1Codes.has(row.v1_code)) failures.push(`매핑의 v1_code 가 v1 에 없다: ${row.v1_code}`);
      if (handled.has(row.v1_code)) failures.push(`매핑에서 v1_code 가 두 번 처리됐다: ${row.v1_code}`);
      handled.set(row.v1_code, row.action);
    }
    if (row.v2_code !== null && v2 && !v2Codes.has(row.v2_code)) {
      failures.push(`매핑의 v2_code 가 v2 에 없다: ${row.v2_code}`);
    }
  }

  // 누락 0 — v1 의 모든 항목이 keep|move|rename|drop 중 하나로 처리돼야 한다.
  if (v1) {
    const missing = [...v1Codes].filter((code) => !handled.has(code));
    if (missing.length) {
      failures.push(`매핑 누락 ${missing.length}건 — 예: ${missing.slice(0, 5).join(", ")}`);
    }
  }
  // 발굴 어휘는 전부 add 로 표시돼야 한다(§7.2-3).
  if (v2) {
    const mapped = new Set((map.mappings ?? []).filter((row) => row.v2_code !== null).map((row) => row.v2_code));
    const unmapped = [...v2Codes].filter((code) => !mapped.has(code));
    if (unmapped.length) {
      failures.push(`v2 항목이 매핑표에 없다 ${unmapped.length}건 — 예: ${unmapped.slice(0, 5).join(", ")}`);
    }
  }
  notes.push(`매핑: ${map.mappings?.length ?? 0}행`);

  // 변경 5 — 여러 v1_code가 하나의 v2_code로 모이는 병합은 정당하다(예: 서로 다른
  // 계열에 있던 같은 어휘가 같은 곳으로 이동). 실패시키지 않고 INFO로만 남긴다.
  const byV2Code = new Map();
  for (const row of map.mappings ?? []) {
    if (row.v1_code === null || row.v2_code === null) continue;
    if (!byV2Code.has(row.v2_code)) byV2Code.set(row.v2_code, []);
    byV2Code.get(row.v2_code).push(row.v1_code);
  }
  const merges = [...byV2Code.entries()].filter(([, v1Codes]) => v1Codes.length >= 2);
  if (merges.length) {
    const examples = merges.slice(0, 5).map(([v2Code, v1Codes]) => `${v2Code}<-${v1Codes.join(",")}`).join(" / ");
    notes.push(`병합 ${merges.length}건: ${examples}`);
  }

  // §7.2-4 규모 보고 + PLAN-V2 §10.1 보완.
  //
  // 원래 규칙은 "어느 카테고리든 v1의 2배를 넘으면 사용자에게 알린다"인데, 신설 계열은
  // v1에 대응 계열이 없어 기준선이 없다 — 무제한으로 커져도 걸리지 않는 구멍이었다.
  // 신설 계열은 대신 "이동해 온 v1 항목 수"를 기준선으로 쓴다: 문헌 발굴분이 이동분보다
  // 많으면 그것은 새 계열이 아니라 새 목록이다.
  //
  // "알린다"를 note로만 두면 조용히 무시되므로, 임계를 넘은 계열은 v2의 scale_report에
  // 기록돼 있어야 통과한다. 기록이 곧 사용자에게 알렸다는 증거다.
  if (v1 && v2) {
    const v1CountByCategory = new Map((v1.categories ?? []).map((c) => [c.code, c.emotions?.length ?? 0]));
    const arrivedFromV1 = new Map(); // v2 category code -> v1에서 넘어온 항목 수
    const discovered = new Map();    // v2 category code -> add 로 들어온 항목 수
    for (const row of map.mappings ?? []) {
      if (row.v2_code === null) continue;
      const categoryCode = row.v2_code.slice(0, row.v2_code.indexOf("-"));
      const bucket = row.action === "add" ? discovered : arrivedFromV1;
      bucket.set(categoryCode, (bucket.get(categoryCode) ?? 0) + 1);
    }

    const acknowledged = new Set(v2.scale_report?.acknowledged_categories ?? []);
    const crossed = [];
    for (const category of v2.categories ?? []) {
      const size = category.emotions?.length ?? 0;
      const baseline = v1CountByCategory.get(category.code);
      if (baseline !== undefined) {
        if (size > baseline * 2) crossed.push(`${category.code} ${size}개 (v1 ${baseline}개의 2배 초과)`);
      } else {
        const moved = arrivedFromV1.get(category.code) ?? 0;
        const added = discovered.get(category.code) ?? 0;
        if (added > moved) crossed.push(`${category.code} 신설 — 발굴 ${added}개 > 이동 ${moved}개`);
      }
      // 레드팀 결함 2 수정 — 위 두 분기는 상한만 본다. 항목이 극단적으로 적은 계열은
      // 어느 쪽에도 걸리지 않고 조용히 통과했다. 상한 조건들과 OR로 결합되는 별도의
      // 하한 조건을 추가한다 — 한 계열이 상한·하한 두 사유로 동시에 걸릴 수도 있다.
      if (size < MIN_CATEGORY_SIZE) crossed.push(`${category.code} ${size}개 (계열 최소 ${MIN_CATEGORY_SIZE}개 미만)`);
    }
    for (const item of crossed) {
      const code = item.split(" ")[0];
      if (!acknowledged.has(code)) {
        failures.push(`규모 보고 누락(§7.2-4): ${item} — v2의 scale_report.acknowledged_categories 에 없다`);
      }
    }
    if (crossed.length) notes.push(`규모 임계 초과 ${crossed.length}건: ${crossed.join(" / ")}`);
  }
}

// ---------------------------------------------------------------- 인용 15단어 (§6.4)

const researchDir = path.join(root, "docs/research");
if (fs.existsSync(researchDir)) {
  const quotePattern = /인용:\s*"([^"]*)"/g;
  for (const name of fs.readdirSync(researchDir)) {
    if (!/^taxonomy-v2-sources-.*\.md$/.test(name)) continue;
    const content = fs.readFileSync(path.join(researchDir, name), "utf8");
    for (const match of content.matchAll(quotePattern)) {
      const words = match[1].trim().split(/\s+/).filter(Boolean);
      if (words.length > QUOTE_WORD_MAX) {
        failures.push(`인용 ${QUOTE_WORD_MAX}단어 초과(${words.length}): docs/research/${name} — "${match[1].slice(0, 60)}…"`);
      }
    }
  }
}

// ---------------------------------------------------------------- 출력

for (const note of notes) console.log(`INFO: ${note}`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log("PASS: taxonomy 검사 완료");
