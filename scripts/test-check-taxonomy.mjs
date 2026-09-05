// check-taxonomy.mjs 역테스트 — 그 20여 규칙이 실제로 위반을 잡아내는지 검증한다.
// scripts/check-taxonomy.mjs 와 schemas/taxonomy.schema.json 은 절대 수정하지 않는다(읽기 전용
// 검사 대상). os.tmpdir() 아래 임시 디렉터리에 둘을 복사해 그 사본에 대해서만 실행하며,
// 실제 저장소의 data/taxonomy/ 는 전혀 건드리지 않는다.
//
// 케이스 표는 { name, mutate, expect, messages } 의 배열이고 실행기가 순회한다 — 케이스를
// 추가하려면 이 표에 항목을 하나 더하면 된다. mutate는 기준선 fixture(v1/v2/map/research)를
// 받아 딱 하나의 위반(또는 무위반)을 만들어 반환한다.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

// process.argv[1] 기준 — "node scripts/test-check-taxonomy.mjs" 로 실행됨을 전제한다.
const scriptDir = path.dirname(process.argv[1]);
const root = path.resolve(scriptDir, "..");

// ---------------------------------------------------------------- 기준선 fixture
//
// check-taxonomy.mjs가 강제하는 모든 규칙에 대해 유효한 v1/v2/map 삼종 세트 + 조사 기록.
// 호출할 때마다 완전히 새 객체를 반환한다(케이스 간 참조 공유로 인한 오염 방지).
// 계열은 joy(2)/anger(2)/sadness(2)/fear(신설,2) 4개, 각 2개씩이라 §7.2-4 하한(5개 미만)에
// 전부 걸리므로 scale_report에 4개 모두 고지해 둔 상태가 "무위반" 기준선이다.

const DUMMY_SHA256 = "a".repeat(64); // 실제 파일과 대조되지 않는 필드(schema 형식만 검사됨) — 고정값으로 충분하다.

function makeBaseline() {
  const v1 = {
    version: "emotion-ko-v1",
    source_files: ["fixture/source-1.jpg"],
    source_hashes: [{ path: "fixture/source-1.jpg", bytes: 100, sha256: DUMMY_SHA256 }],
    review_status: "reviewed",
    transcription_notes: ["fixture 전용 v1 — 실제 원자료 아님"],
    categories: [
      {
        code: "joy", label_ko: "기쁨", color_token: "color.joy", character_asset: "assets/joy.svg",
        emotions: [
          { code: "joy-a", label_ko: "설레는" },
          { code: "joy-b", label_ko: "산뜻한" }
        ]
      },
      {
        code: "anger", label_ko: "분노", color_token: "color.anger", character_asset: "assets/anger.svg",
        emotions: [
          { code: "anger-a", label_ko: "부글거리는" },
          { code: "anger-b", label_ko: "억울한" },
          { code: "anger-c", label_ko: "구역질나는" }
        ]
      },
      {
        code: "sadness", label_ko: "슬픔", color_token: "color.sadness", character_asset: "assets/sadness.svg",
        emotions: [
          { code: "sadness-a", label_ko: "쓸쓸한" },
          { code: "sadness-b", label_ko: "먹먹한" }
        ]
      }
    ],
    review: {
      first_pass_by: null, first_pass_date: null,
      second_pass_by: null, second_pass_date: null,
      user_cross_check_by: "tester", user_cross_check_date: "2026-09-04"
    }
  };

  const v2 = {
    version: "emotion-ko-v2",
    based_on: "emotion-ko-v1",
    review_status: "reviewed",
    disclaimer_ko: "fixture 전용 성격 규정 — 실제 문서 아님",
    fulltext_sources: ["A-1", "B-1"],
    evidence_catalog: {
      "A-1": { evidence_level: "L1", verification: "V1", label: "Source A1" },
      "A-2": { evidence_level: "L2", verification: "V1", label: "Source A2" },
      "B-1": { evidence_level: "L1", verification: "V2", label: "Source B1" },
      "B-2": { evidence_level: "L3", verification: "V1", label: "Source B2" },
      "C-1": { evidence_level: "L2", verification: "V1", label: "Source C1" }
    },
    scale_report: {
      acknowledged_categories: ["joy", "anger", "sadness", "fear"],
      acknowledged_by: "tester",
      acknowledged_at: "2026-09-04",
      note_ko: "fixture 전 계열이 5개 미만(하한 미달) + fear 는 v1 대응 계열이 없고 전량 발굴이라 규모 보고 대상"
    },
    categories: [
      {
        code: "joy", label_ko: "기쁨", color_token: "color.joy", character_asset: "assets/joy.svg",
        boundary_ko: "fixture 경계 문장 — 기쁨", is_new_in_v2: false,
        category_evidence_refs: ["A-1", "A-2"], category_grade: "B+",
        emotions: [
          { code: "joy-a", label_ko: "설레는", source: "raw", evidence_level: "L1", verification: "V1", evidence_grade: "A", evidence_ref: "A-1", reviewer: "tester", reviewed_at: "2026-09-04" },
          { code: "joy-b", label_ko: "산뜻한", source: "raw", evidence_level: "L2", verification: "V1", evidence_grade: "B+", evidence_ref: "A-2", reviewer: "tester", reviewed_at: "2026-09-04" }
        ]
      },
      {
        code: "anger", label_ko: "분노", color_token: "color.anger", character_asset: "assets/anger.svg",
        boundary_ko: "fixture 경계 문장 — 분노", is_new_in_v2: false,
        category_evidence_refs: ["B-1", "C-1"], category_grade: "B",
        shortfall_note_ko: "근거 2편은 있으나 B-1이 조사자 보고(V2)라 등급이 B에 그친다(편수 아닌 등급 기준)",
        emotions: [
          { code: "anger-a", label_ko: "부글거리는", source: "raw", evidence_level: "L1", verification: "V2", evidence_grade: "B", evidence_ref: "B-1", reviewer: "tester", reviewed_at: "2026-09-04" },
          { code: "anger-b", label_ko: "억울한", source: "raw", evidence_level: "L2", verification: "V1", evidence_grade: "B+", evidence_ref: "C-1", reviewer: "tester", reviewed_at: "2026-09-04" }
        ]
      },
      {
        code: "sadness", label_ko: "슬픔", color_token: "color.sadness", character_asset: "assets/sadness.svg",
        boundary_ko: "fixture 경계 문장 — 슬픔", is_new_in_v2: false,
        category_evidence_refs: ["B-2"], category_grade: "C",
        shortfall_note_ko: "1편뿐이나 원자료 보존을 위해 존치한다",
        emotions: [
          { code: "sadness-a", label_ko: "쓸쓸한", source: "raw", evidence_level: "L3", verification: "V1", evidence_grade: "C", evidence_ref: "B-2", reviewer: "tester", reviewed_at: "2026-09-04" },
          { code: "sadness-b", label_ko: "먹먹한", source: "raw", evidence_level: "L2", verification: "V1", evidence_grade: "B+", evidence_ref: "A-2", reviewer: "tester", reviewed_at: "2026-09-04" }
        ]
      },
      {
        code: "fear", label_ko: "공포", color_token: "color.fear", character_asset: "assets/fear.svg",
        boundary_ko: "fixture 경계 문장 — 공포(신설)", is_new_in_v2: true,
        category_evidence_refs: ["A-1", "B-1"], category_grade: "B",
        shortfall_note_ko: "A-1은 전문 대조(V1)로 A지만 B-1이 조사자 보고(V2)라 계열 등급이 B로 묶인다",
        emotions: [
          { code: "fear-a", label_ko: "무서운", source: "literature", evidence_level: "L1", verification: "V1", evidence_grade: "A", evidence_ref: "A-1", reviewer: "tester", reviewed_at: "2026-09-04" },
          { code: "fear-b", label_ko: "겁나는", source: "literature", evidence_level: "L1", verification: "V2", evidence_grade: "B", evidence_ref: "B-1", reviewer: "tester", reviewed_at: "2026-09-04" }
        ]
      }
    ],
    review: {
      first_pass_by: null, first_pass_date: null,
      second_pass_by: null, second_pass_date: null,
      user_cross_check_by: "tester", user_cross_check_date: "2026-09-04"
    }
  };

  const map = {
    version: "emotion-ko-v1-to-v2",
    from: "emotion-ko-v1",
    to: "emotion-ko-v2",
    generated_at: "2026-09-04",
    mappings: [
      { v1_code: "joy-a", v2_code: "joy-a", action: "keep", reason: "동일 유지" },
      { v1_code: "joy-b", v2_code: "joy-b", action: "keep", reason: "동일 유지" },
      { v1_code: "anger-a", v2_code: "anger-a", action: "keep", reason: "동일 유지" },
      { v1_code: "anger-b", v2_code: "anger-b", action: "keep", reason: "동일 유지" },
      { v1_code: "anger-c", v2_code: "anger-a", action: "move", reason: "병합 fixture — anger-a로 합류" },
      { v1_code: "sadness-a", v2_code: "sadness-a", action: "keep", reason: "동일 유지" },
      { v1_code: "sadness-b", v2_code: "sadness-b", action: "keep", reason: "동일 유지" },
      { v1_code: null, v2_code: "fear-a", action: "add", reason: "신설 계열 발굴" },
      { v1_code: null, v2_code: "fear-b", action: "add", reason: "신설 계열 발굴" }
    ]
  };

  const research = `# fixture 조사 기록\n\n인용: "one two three four five six seven eight nine ten"\n`;

  return { v1, v2, map, research };
}

// anger 계열(category 객체를 직접 받는다)에 항목을 추가하고 매핑 add 행도 함께 추가한다
// (§7.2-4 규모 하한 케이스 전용).
function pushAngerEmotion(category, map, code, labelKo) {
  category.emotions.push({
    code, label_ko: labelKo, source: "literature",
    evidence_level: "L1", verification: "V1", evidence_grade: "A", evidence_ref: "A-1",
    reviewer: "tester", reviewed_at: "2026-09-04"
  });
  map.mappings.push({ v1_code: null, v2_code: code, action: "add", reason: "규모 하한 테스트용" });
}

// ---------------------------------------------------------------- 임시 실행 환경
//
// 실제 저장소의 scripts/check-taxonomy.mjs·schemas/taxonomy.schema.json 을 os.tmpdir() 아래
// 사본으로 복사해 그 사본만 실행한다. 검사기는 자기 위치(scriptDir) 기준으로 root를 잡으므로
// data/taxonomy 도 이 임시 root 아래에 있어야 한다 — 실제 저장소의 data/ 는 건드리지 않는다.

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "check-taxonomy-test-"));
const tmpScripts = path.join(tmpRoot, "scripts");
const tmpSchemas = path.join(tmpRoot, "schemas");
const tmpData = path.join(tmpRoot, "data", "taxonomy");
const tmpResearch = path.join(tmpRoot, "docs", "research");

fs.mkdirSync(tmpScripts, { recursive: true });
fs.mkdirSync(tmpSchemas, { recursive: true });
fs.mkdirSync(tmpData, { recursive: true });
fs.mkdirSync(tmpResearch, { recursive: true });

fs.copyFileSync(path.join(root, "scripts/check-taxonomy.mjs"), path.join(tmpScripts, "check-taxonomy.mjs"));
fs.copyFileSync(path.join(root, "schemas/taxonomy.schema.json"), path.join(tmpSchemas, "taxonomy.schema.json"));
const checkerPath = path.join(tmpScripts, "check-taxonomy.mjs");

function writeFixture({ v1, v2, map, research }) {
  fs.writeFileSync(path.join(tmpData, "v1.json"), JSON.stringify(v1, null, 2));
  fs.writeFileSync(path.join(tmpData, "v2.json"), JSON.stringify(v2, null, 2));
  fs.writeFileSync(path.join(tmpData, "v1-to-v2.json"), JSON.stringify(map, null, 2));
  fs.writeFileSync(path.join(tmpResearch, "taxonomy-v2-sources-fixture.md"), research);
}

function runChecker() {
  const result = spawnSync(process.execPath, [checkerPath], { encoding: "utf8" });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

// ---------------------------------------------------------------- 케이스 표
//
// expect: "fail" | "pass". messages: FAIL 출력에 전부 포함돼야 하는 부분 문자열 배열
// (pass 기대 케이스는 보통 빈 배열 — 대신 "PASS: taxonomy 검사 완료" 를 직접 확인한다).

const cases = [
  {
    name: "기준선 fixture는 무변이 상태로 전체 통과한다",
    mutate: (fx) => fx,
    expect: "pass",
    messages: []
  },

  // ---- evidence_catalog 대조(카탈로그 미존재 참조, fulltext_sources 정합, 계열 근거 참조) ----
  {
    name: "카탈로그에 없는 evidence_ref를 쓰면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[0].emotions[0].evidence_ref = "C-9"; // joy-a: A-1 -> C-9(패턴은 유효, 카탈로그엔 없음)
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 evidence_ref 가 카탈로그에 없다: joy-a -> C-9"]
  },
  {
    name: "카탈로그 L1인데 fulltext_sources에서 빠지면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.fulltext_sources = v2.fulltext_sources.filter((r) => r !== "B-1");
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 fulltext_sources 누락: B-1 는 카탈로그에서 L1 이다"]
  },
  {
    name: "fulltext_sources에 L1이 아닌 ref가 섞이면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.fulltext_sources = [...v2.fulltext_sources, "C-1"]; // C-1은 카탈로그에서 L2
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 fulltext_sources 에 L1 이 아닌 출처가 있다: C-1 (카탈로그=L2)"]
  },
  {
    name: "category_evidence_refs의 ref가 카탈로그에 없으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[1].category_evidence_refs = ["B-1", "C-9"]; // anger: C-1 -> C-9(카탈로그에 없음)
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 계열 근거 ref 가 카탈로그에 없다: anger -> C-9"]
  },

  // ---- evidence_level 천장(카탈로그 기준) + 하향 사유 ----
  {
    name: "카탈로그보다 강한 level을 주장(과잉 주장)하면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const emotion = v2.categories[0].emotions[1]; // joy-b: 카탈로그 A-2=L2인데 항목을 L1로
      emotion.evidence_level = "L1";
      emotion.evidence_grade = "A"; // 등급 도출 위반과 섞이지 않도록 (V1,L1)의 올바른 값으로 맞춘다
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 evidence_level 과잉 주장: joy-b -> A-2 항목=L1 카탈로그=L2 (카탈로그보다 강할 수 없다)"]
  },
  {
    name: "사유 없이 카탈로그보다 약한 level로 낮추면 잡힌다(joy-a)",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[0].emotions[0].evidence_level = "L2"; // joy-a: 카탈로그 A-1=L1인데 항목만 L2로(사유 없음)
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 등급 하향 사유 없음: joy-a -> A-1 (카탈로그 L1 → 항목 L2)"]
  },
  {
    name: "사유 없이 카탈로그보다 약한 level로 낮추면 잡힌다(sadness-b)",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[2].emotions[1].evidence_level = "L3"; // sadness-b: 카탈로그 A-2=L2인데 항목만 L3로(사유 없음)
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 등급 하향 사유 없음: sadness-b -> A-2 (카탈로그 L2 → 항목 L3)"]
  },
  {
    name: "사유를 남기고 낮추면 통과한다(정당한 하향)",
    mutate: ({ v1, v2, map, research }) => {
      const emotion = v2.categories[0].emotions[0]; // joy-a: L1 -> L2 + 사유
      emotion.evidence_level = "L2";
      emotion.evidence_grade = "B+";
      emotion.level_downgrade_reason = "A-1 전문은 범주 전반의 독립성만 지지하며 이 개별 어휘의 귀속까지 지지하지는 않는다";
      return { v1, v2, map, research };
    },
    expect: "pass",
    messages: []
  },
  {
    name: "카탈로그와 같은 level인데 사유가 있으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[0].emotions[0].level_downgrade_reason = "하향이 아닌데 붙인 불필요한 사유"; // joy-a는 이미 카탈로그와 동일한 L1
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 하향이 아닌데 level_downgrade_reason 이 있다: joy-a"]
  },

  // ---- verification 대조 ----
  {
    name: "verification이 카탈로그와 다르면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[2].emotions[1].verification = "V2"; // sadness-b: 카탈로그 A-2=V1인데 항목만 V2로
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 verification 이 카탈로그와 다르다: sadness-b -> A-2 항목=V2 카탈로그=V1"]
  },

  // ---- L1 완전성(전문 확보 출처) ----
  {
    name: "L1 주장인데 ref가 fulltext_sources에 없으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.fulltext_sources = v2.fulltext_sources.filter((ref) => ref !== "A-1"); // joy-a·fear-a가 L1로 인용하는 A-1을 제거
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 L1 주장인데 전문 확보 출처가 아니다: joy-a -> A-1"]
  },

  // ---- 등급 도출(emotion.evidence_grade) ----
  {
    name: "(V1,L2)를 A로 기록하면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[0].emotions[1].evidence_grade = "A"; // joy-b: (V1,L2)는 B+인데 A로
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 등급 도출 위반: joy-b 는 (V1, L2) → B+ 여야 하는데 A"]
  },

  // ---- 계열 등급 도출(category_grade) ----
  {
    name: "category_grade가 도출값과 다르면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[0].category_grade = "C"; // joy: refs [A-1(A),A-2(B+)] -> 기대 B+, 실제 C로 왜곡
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 계열 등급 도출 위반: joy 는 A-1, A-2 에서 B+ 이어야 하는데 C"]
  },

  // ---- shortfall_note_ko (근거가 약한 상태의 설명 의무, 양방향) ----
  {
    name: "계열 근거 1편인데 shortfall_note_ko가 없으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      delete v2.categories[2].shortfall_note_ko; // sadness: refs 1개(B-2)
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 계열 근거가 약한데 shortfall_note_ko 가 없다: sadness (refs 1편, grade C)"]
  },
  {
    name: "refs 2편이라도 grade가 약하면 shortfall_note_ko가 없으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      // sadness: A-1(V1,L1->A) + B-2(V1,L3->C) -> 2번째로 강한 등급 C(도출과 일치). 노트만 제거.
      const sadness = v2.categories[2];
      sadness.category_evidence_refs = ["A-1", "B-2"];
      sadness.category_grade = "C";
      delete sadness.shortfall_note_ko;
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 계열 근거가 약한데 shortfall_note_ko 가 없다: sadness (refs 2편, grade C)"]
  },
  {
    name: "refs 2편 + grade C + shortfall_note_ko 있으면 통과한다",
    mutate: ({ v1, v2, map, research }) => {
      const sadness = v2.categories[2];
      sadness.category_evidence_refs = ["A-1", "B-2"];
      sadness.category_grade = "C";
      sadness.shortfall_note_ko = "근거 2편이나 둘 다 약해(A-1은 범주 전반만 지지, B-2는 2차 경유) C에 그친다";
      return { v1, v2, map, research };
    },
    expect: "pass",
    messages: []
  },
  {
    name: "근거가 충분한데 shortfall_note_ko가 있으면 잡힌다(불필요한 노트)",
    mutate: ({ v1, v2, map, research }) => {
      const sadness = v2.categories[2];
      v2.evidence_catalog["A-3"] = { evidence_level: "L1", verification: "V1", label: "Source A3 (fixture 전용)" };
      sadness.category_evidence_refs = ["A-1", "A-3"]; // 2번째로 강한 등급도 A -> category_grade A
      sadness.category_grade = "A";
      sadness.shortfall_note_ko = "불필요한데 남아있는 노트";
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 계열 근거가 충분한데 shortfall_note_ko 가 있다: sadness (refs 2편, grade A)"]
  },

  // ---- D-022 emotion_code 접두어 ----
  {
    name: "D-022 접두어가 소속 계열과 다르면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[3].emotions[0].code = "joy-fa"; // fear 계열 안에 joy- 접두어 코드
      map.mappings[7].v2_code = "joy-fa"; // 매핑도 함께 갱신해 매핑 오류와 분리
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 D-022 접두어 불일치: joy-fa 가 카테고리 fear 안에 있다"]
  },

  // ---- v1 -> v2 매핑표 ----
  {
    name: "매핑표에서 v1 항목이 누락되면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      map.mappings = map.mappings.filter((row) => row.v1_code !== "sadness-b");
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["매핑 누락 1건"]
  },
  {
    name: "action=add인데 v1_code가 있으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const addRow = map.mappings.find((row) => row.v2_code === "fear-a");
      addRow.v1_code = "joy-a";
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["매핑 action=add 인데 v1_code 가 있다: fear-a"]
  },

  // ---- schema 대조(구조 층) ----
  {
    name: "schema에 없는 속성이 있으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.categories[0].bogus_prop = true;
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["알 수 없는 속성 — bogus_prop"]
  },

  // ---- C등급 비율 상한 ----
  {
    name: "C등급 비율이 상한(15%)을 넘으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const toC = (emotion) => {
        emotion.evidence_level = "L4";
        emotion.evidence_grade = "C";
        delete emotion.evidence_ref;
      };
      toC(v2.categories[0].emotions[0]); // joy-a
      toC(v2.categories[1].emotions[0]); // anger-a
      toC(v2.categories[2].emotions[1]); // sadness-b
      // sadness-a는 baseline에서 이미 C -> 총 4/8 = 50%
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 C등급 비율 초과: 50.0% (상한 15%, 4/8)"]
  },

  // ---- 인용 15단어 상한(§6.4) ----
  {
    name: "인용이 15단어를 넘으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const research16 = `# fixture 조사 기록\n\n인용: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen"\n`;
      return { v1, v2, map, research: research16 };
    },
    expect: "fail",
    messages: ["인용 15단어 초과(16)"]
  },

  // ---- D-027 검수 증거(review_status와 review 블록의 정합, v1/v2 공통) ----
  {
    name: "v1: reviewed인데 D-027 검수 증거가 없으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v1.review.user_cross_check_by = null;
      v1.review.user_cross_check_date = null;
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v1 review_status=reviewed 인데 D-027 검수 증거가 없다(시간 분리 2회 또는 사용자 최종 대조)"]
  },
  {
    name: "v2: reviewed인데 review 6개 필드가 전부 null이면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.review = {
        first_pass_by: null, first_pass_date: null,
        second_pass_by: null, second_pass_date: null,
        user_cross_check_by: null, user_cross_check_date: null
      };
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 review_status=reviewed 인데 D-027 검수 증거가 없다(시간 분리 2회 또는 사용자 최종 대조)"]
  },
  {
    name: "v2: 시간 분리 2회(날짜만 채움)면 통과한다",
    mutate: ({ v1, v2, map, research }) => {
      // 검사식은 first_pass_date && second_pass_date만 본다(각 _by는 보지 않는다) — 그 사실 자체를 검증한다.
      v2.review = {
        first_pass_by: null, first_pass_date: "2026-08-01",
        second_pass_by: null, second_pass_date: "2026-08-10",
        user_cross_check_by: null, user_cross_check_date: null
      };
      return { v1, v2, map, research };
    },
    expect: "pass",
    messages: []
  },
  {
    name: "v2: user_cross_check_by만 있고 date가 없으면 잡힌다(둘 다 필요)",
    mutate: ({ v1, v2, map, research }) => {
      v2.review = {
        first_pass_by: null, first_pass_date: null,
        second_pass_by: null, second_pass_date: null,
        user_cross_check_by: "tester", user_cross_check_date: null
      };
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 review_status=reviewed 인데 D-027 검수 증거가 없다(시간 분리 2회 또는 사용자 최종 대조)"]
  },
  {
    name: "v2: pending_user_review 상태면 검수 증거가 없어도 통과한다",
    mutate: ({ v1, v2, map, research }) => {
      v2.review_status = "pending_user_review";
      v2.review = {
        first_pass_by: null, first_pass_date: null,
        second_pass_by: null, second_pass_date: null,
        user_cross_check_by: null, user_cross_check_date: null
      };
      return { v1, v2, map, research };
    },
    expect: "pass",
    messages: []
  },

  // ---- 아카이브 계층(원자료 보존, source=raw && evidence_level=L4 -> grade B 고정) ----
  {
    name: "아카이브(raw+L4)인데 grade를 C로 적으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const joyA = v2.categories[0].emotions[0];
      joyA.evidence_level = "L4";
      joyA.evidence_grade = "C"; // 틀린 값 — 아카이브 계층이면 B 여야 한다
      delete joyA.evidence_ref;
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 아카이브 등급 위반: joy-a 는 원자료 보존(raw+L4)이므로 B 여야 하는데 C"]
  },
  {
    name: "아카이브(raw+L4)+grade B+매핑 keep이면 통과한다",
    mutate: ({ v1, v2, map, research }) => {
      const joyA = v2.categories[0].emotions[0];
      joyA.evidence_level = "L4";
      joyA.evidence_grade = "B";
      delete joyA.evidence_ref;
      return { v1, v2, map, research }; // 매핑은 baseline 그대로 keep 1행
    },
    expect: "pass",
    messages: []
  },
  {
    name: "아카이브(raw+L4)인데 매핑 action이 keep이 아니면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const joyA = v2.categories[0].emotions[0];
      joyA.evidence_level = "L4";
      joyA.evidence_grade = "B";
      delete joyA.evidence_ref;
      const row = map.mappings.find((r) => r.v1_code === "joy-a" && r.v2_code === "joy-a");
      row.action = "move"; // keep -> move
      row.reason = "아카이브 등급인데 이동으로 잘못 기록한 시나리오";
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 아카이브 등급인데 매핑이 keep 이 아니다: joy-a (행 1개, action=move)"]
  },
  {
    name: "아카이브(raw+L4)인데 매핑 행이 2개(병합)면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      // anger-a: baseline에 이미 매핑 2행(anger-a:keep + anger-c->anger-a:move, 병합 fixture)이 걸려 있다.
      const angerA = v2.categories[1].emotions[0];
      angerA.evidence_level = "L4";
      angerA.evidence_grade = "B";
      delete angerA.evidence_ref;
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 아카이브 등급인데 매핑이 keep 이 아니다: anger-a (행 2개, action=keep, move)"]
  },
  {
    name: "아카이브(raw+L4)인데 level_downgrade_reason이 있으면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const joyA = v2.categories[0].emotions[0];
      joyA.evidence_level = "L4";
      joyA.evidence_grade = "B";
      delete joyA.evidence_ref;
      joyA.level_downgrade_reason = "카탈로그와 대조할 수 없는데도 붙인 사유";
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 L4 항목에 level_downgrade_reason 이 있다: joy-a (대조할 카탈로그 값이 없다)"]
  },
  {
    name: "source가 literature인데 L4면 잡힌다(문헌 출처는 근거가 있어야 함)",
    mutate: ({ v1, v2, map, research }) => {
      const fearA = v2.categories[3].emotions[0]; // fear-a: source=literature
      fearA.evidence_level = "L4";
      fearA.evidence_grade = "C"; // 비-아카이브(source!=raw)라 GRADE_TABLE.V1.L4 = C
      delete fearA.evidence_ref;
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["v2 문헌 출처인데 근거 수준이 L4 다: fear-a (source=literature)"]
  },
  {
    name: "raw+L2(문헌 근거 있음)는 아카이브 계층이 아니라 정상 도출된다",
    mutate: ({ v1, v2, map, research }) => {
      const joyA = v2.categories[0].emotions[0]; // source=raw 유지, L1/A-1 -> L2/A-2(카탈로그와 정확히 일치)
      joyA.evidence_level = "L2";
      joyA.evidence_ref = "A-2";
      joyA.evidence_grade = "B+"; // GRADE_TABLE.V1.L2 = B+(아카이브 우회 없음)
      return { v1, v2, map, research };
    },
    expect: "pass",
    messages: []
  },

  // ---- §7.2-4 규모 보고(상한: v1의 2배 초과 / 신설계열 발굴>이동, 하한: 계열 최소 5개) ----
  {
    name: "신설 계열이 발굴>이동인데 미고지면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      v2.scale_report.acknowledged_categories = []; // fear 미고지
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["규모 보고 누락(§7.2-4): fear 신설 — 발굴 2개 > 이동 0개"]
  },
  {
    name: "기존 계열이 v1의 2배를 넘는데 미고지면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const angerCategory = v2.categories[1];
      for (let i = 1; i <= 5; i += 1) {
        angerCategory.emotions.push({
          code: `anger-x${i}`, label_ko: `임시분노${i}`, source: "literature",
          evidence_level: "L1", verification: "V1", evidence_grade: "A", evidence_ref: "A-1",
          reviewer: "tester", reviewed_at: "2026-09-04"
        });
        map.mappings.push({ v1_code: null, v2_code: `anger-x${i}`, action: "add", reason: "규모 임계 테스트용" });
      }
      // anger만 미고지로 되돌린다 — 상한(2배) 조건을 하한 조건과 분리한다(7개 >= 5라 하한은 안 걸림).
      v2.scale_report.acknowledged_categories = v2.scale_report.acknowledged_categories.filter((c) => c !== "anger");
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["규모 보고 누락(§7.2-4): anger 7개 (v1 3개의 2배 초과)"]
  },
  {
    name: "계열 항목이 4개(하한 미달)인데 미고지면 잡힌다",
    mutate: ({ v1, v2, map, research }) => {
      const anger = v2.categories[1]; // v1 baseline 3개 -> 상한 6개, 4개는 상한과 겹치지 않는다
      pushAngerEmotion(anger, map, "anger-m1", "임시분노m1");
      pushAngerEmotion(anger, map, "anger-m2", "임시분노m2");
      v2.scale_report.acknowledged_categories = v2.scale_report.acknowledged_categories.filter((c) => c !== "anger");
      return { v1, v2, map, research };
    },
    expect: "fail",
    messages: ["규모 보고 누락(§7.2-4): anger 4개 (계열 최소 5개 미만)"]
  },
  {
    name: "계열 항목이 4개라도 scale_report에 고지되면 통과한다",
    mutate: ({ v1, v2, map, research }) => {
      const anger = v2.categories[1];
      pushAngerEmotion(anger, map, "anger-m1", "임시분노m1");
      pushAngerEmotion(anger, map, "anger-m2", "임시분노m2");
      // scale_report는 baseline 그대로(anger 포함 전 계열 고지) -> 통과
      return { v1, v2, map, research };
    },
    expect: "pass",
    messages: []
  },
  {
    name: "계열 항목이 정확히 5개(하한 경계)면 미고지라도 통과한다",
    mutate: ({ v1, v2, map, research }) => {
      const anger = v2.categories[1]; // 5개: 상한(6) 미만이자 하한(5) 미만도 아님 -> 어느 쪽도 안 걸림
      pushAngerEmotion(anger, map, "anger-m1", "임시분노m1");
      pushAngerEmotion(anger, map, "anger-m2", "임시분노m2");
      pushAngerEmotion(anger, map, "anger-m3", "임시분노m3");
      v2.scale_report.acknowledged_categories = v2.scale_report.acknowledged_categories.filter((c) => c !== "anger");
      return { v1, v2, map, research };
    },
    expect: "pass",
    messages: []
  }
];

// ---------------------------------------------------------------- 실행기

let passCount = 0;
let failCount = 0;

for (const testCase of cases) {
  const baseline = makeBaseline();
  const fixture = testCase.mutate(baseline);
  writeFixture(fixture);
  const { status, output } = runChecker();
  const failed = status !== 0;
  const hasAllMessages = testCase.messages.every((m) => output.includes(m));
  const ok = testCase.expect === "fail"
    ? failed && hasAllMessages
    : !failed && output.includes("PASS: taxonomy 검사 완료");

  if (ok) {
    passCount += 1;
    console.log(`PASS  ${testCase.name}`);
  } else {
    failCount += 1;
    console.log(`FAIL  ${testCase.name}`);
    console.log(`      기대=${testCase.expect} 실제 exit=${status}`);
    const missing = testCase.messages.filter((m) => !output.includes(m));
    if (missing.length) console.log(`      누락된 기대 메시지: ${JSON.stringify(missing)}`);
    console.log(`      ----검사기 출력----\n${output.trim().split(/\r?\n/).map((l) => `      ${l}`).join("\n")}`);
  }
}

console.log(`\n${passCount}/${cases.length} PASS, ${failCount} FAIL`);

fs.rmSync(tmpRoot, { recursive: true, force: true });

process.exit(failCount > 0 ? 1 : 0);
