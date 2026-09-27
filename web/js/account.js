// 계정(공개 서비스 시안, D-104). 실제 로그인·저장·전송은 없고 모듈 변수로만 들고 있는다 — 로그인·가입·설정의 내 계정이 이 하나를 같이 본다.
// 가입에서 받는 것은 최소다: 부를 이름 하나와 필수 동의. 이메일·전화번호·성별·생년은 받지 않는다(ARCHITECTURE §6 '원시 이메일은 필요하지 않으면 저장하지 않는다').
// 이름은 지어낸 예시다(AGENTS §3).
export const PROVIDERS = {
  kakao: { label: "카카오", with: "카카오와", button: "카카오로 계속하기" },
  apple: { label: "Apple", with: "Apple과", button: "Apple로 계속하기" },
  google: { label: "Google", with: "Google과", button: "Google로 계속하기" }
};
export const NAME_MAX = 12;
export const account = { name: "하늘", via: "kakao", joined: "2026-09-01" };

// 이름 규칙: 앞뒤 빈칸을 뺀 1~12자. 빈칸만 있으면 이름이 아니다.
export const cleanName = (s) => s.replace(/\s+/g, " ").trim();
export const nameLength = (s) => [...cleanName(s)].length; // 이모지 하나를 한 글자로 센다

export const joinedLabel = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${y}년 ${m}월 ${d}일`; };
