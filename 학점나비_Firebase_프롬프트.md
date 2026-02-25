# 학점나비 (HakjeomNavi) - Firebase Studio 프로젝트 설정 프롬프트

## 프로젝트 개요

"학점나비"는 고교학점제 AI 맞춤 과목 추천 서비스입니다.
학생이 자기 학교와 희망 진로를 입력하면, 실제 개설과목 데이터를 기반으로 AI가 최적의 과목 선택을 추천해줍니다.

### 핵심 정보
- **앱 이름**: 학점나비 (HakjeomNavi)
- **타겟**: 부산 고등학생 (139개교) → 전국 확장 예정
- **수익 모델**: B2C 프리미엄 + B2G 교육청 납품 + B2B 학원 제휴
- **기술 스택**: Next.js + Firebase (Firestore, Cloud Functions, Hosting) + Claude API

---

## 기능 요구사항

### 1단계 MVP (지금 구현)

**[기능1] 학교 검색·선택**
- 부산 139개 고등학교 검색 (일반고 92, 특성화고 32, 특목고 11, 자율고 4)
- 학교 유형별 필터 (전체/일반고/특성화고/특목고/자율고)
- 학교명 한글 검색

**[기능2] 학년별 개설과목 조회**
- 선택한 학교의 1~3학년별 실제 개설과목 표시
- 총 1,932개 고유 과목 (NEIS 공공데이터 API 수집)
- 과목 목록 토글 표시

**[기능3] 진로 입력**
- 자유 텍스트 입력 (예: "독일 대학교에서 역사학을 전공하고 싶어요")
- 빠른 선택 태그 (독일유학, 의대진학, IT/프로그래밍, 경영/경제, 교대/사범대, 예체능)

**[기능4] AI 맞춤 과목 추천**
- Claude API로 학교 개설과목 + 진로를 교차 분석
- 4단계 추천: 필수(🔴) / 적극추천(🟠) / 고려(🟢) / 후순위(⚪)
- 전략 요약 + 진로 팁 제공
- API 실패 시 로컬 키워드 매칭 폴백

### 2단계 (커리어넷 API 승인 후)

**[기능5] 대학·학과 연동**
- 커리어넷 API로 학과 목록 검색
- 학과별 관련 고교 과목 자동 매칭 (relate_subject 필드)
  - 공통과목 / 일반선택과목 / 진로선택과목 / 전문교과Ⅰ
- 학과별 설치대학 목록 표시
- 관련 직업·자격증 정보

**[기능6] 교차 분석 고도화**
- 학과 추천과목 vs 내 학교 개설과목 교차
  - ✅ "이 과목 있음 → 반드시 수강"
  - ⚠️ "이 과목 없음 → 온라인 공동교육과정 대체 가능"
  - ❌ "이 과목 없음 → 유사 과목 추천"

### 3단계 (향후)

**[기능7] 입시 전형 연동**
- 대입정보포털 "어디가" 데이터 연동
- 수시/정시 전형별 과목 전략 차별화

**[기능8] 사용자 시스템**
- Firebase Auth (구글/카카오 로그인)
- 과목 선택 저장, 시뮬레이션, 공유

---

## 데이터 구조

### Firestore 컬렉션 설계

```
firestore/
├── schools/                     ← 고등학교 데이터
│   └── {schoolCode}/            ← 예: "7150148"
│       ├── name: "성도고등학교"
│       ├── type: "일반고"
│       ├── region: "부산"
│       ├── subjects_by_grade: {
│       │     "1학년": ["공통국어1","공통수학1","공통영어1",...],
│       │     "2학년": ["문학","수학Ⅰ","영어Ⅰ",...],
│       │     "3학년": ["기하","화학Ⅱ","심리학",...]
│       │   }
│       └── updated_at: Timestamp
│
├── majors/                      ← 대학 학과 데이터 (커리어넷)
│   └── {majorSeq}/              ← 학과코드
│       ├── name: "법학과"
│       ├── category: "사회계열"
│       ├── relate_subject: {
│       │     "공통과목": "...",
│       │     "일반선택과목": "정치와 법, 사회·문화, ...",
│       │     "진로선택과목": "사회문제 탐구",
│       │     "전문교과Ⅰ": "..."
│       │   }
│       ├── universities: [{name, area, url}]
│       ├── jobs: "변호사, 법무사, ..."
│       ├── qualifications: "변호사, 법무사, ..."
│       └── career_activities: [{name, description}]
│
├── users/                       ← 사용자 (3단계)
│   └── {uid}/
│       ├── school: "7150148"
│       ├── grade: 2
│       ├── career_goal: "독일유학 역사학"
│       ├── saved_recommendations: [...]
│       └── created_at: Timestamp
│
└── metadata/                    ← 메타 정보
    └── data_version/
        ├── neis_ay: "2025"
        ├── neis_updated: Timestamp
        ├── career_updated: Timestamp
        └── school_count: 139
```

### 초기 데이터 (NEIS API 수집 완료)

부산 139개교 데이터가 JSON으로 준비되어 있습니다.
- 파일: `busan_all_subjects.json` (541KB)
- 구조: { "학교코드": { name, type, status, total_records, subjects_by_grade: { "1학년": [...], ... } } }
- 이 파일을 Firestore에 업로드하는 시드 스크립트가 필요합니다.

---

## API 연동 정보

### 1. NEIS 공공데이터 API (수집 완료, 갱신용)
- **엔드포인트**: https://open.neis.go.kr/hub/hisTimetable
- **API KEY**: 6c28d23ebed746a7a1559a5976a459de
- **용도**: 고등학교 시간표에서 과목명(ITRT_CNTNT) 추출
- **갱신 주기**: 매년 3월 (신학년도), 9월 (2학기)
- **파라미터**: ATPT_OFCDC_SC_CODE=C10 (부산), AY=2025, pSize=1000

### 2. 커리어넷 대학학과정보 API (승인 대기 중)
- **엔드포인트**: https://www.career.go.kr/cnet/openapi/getOpenApi.json
- **API KEY**: [승인 후 입력]
- **핵심 파라미터**:
  - svcType=api, svcCode=MAJOR (목록) / MAJOR_VIEW (상세)
  - gubun=대학교, subject=전체
- **핵심 응답 필드**: relate_subject (관련 고교 과목), university (설치대학)

### 3. Claude API (AI 추천)
- **모델**: claude-sonnet-4-20250514
- **용도**: 학교 개설과목 + 진로 매칭 → 맞춤 과목 추천
- **위치**: 프론트엔드에서 직접 호출 (API 키 없이, Anthropic 내부 처리)
  - 또는 Cloud Functions에서 호출 (서버사이드, API 키 필요)

---

## 프로젝트 구조

```
hakjeomnavi/
├── app/                          ← Next.js App Router
│   ├── layout.tsx                ← 공통 레이아웃
│   ├── page.tsx                  ← 메인 (웰컴 화면)
│   ├── select-school/
│   │   └── page.tsx              ← 학교 선택
│   ├── select-career/
│   │   └── page.tsx              ← 학년·진로 입력
│   ├── recommendation/
│   │   └── page.tsx              ← AI 추천 결과
│   └── globals.css
│
├── components/
│   ├── SchoolSelector.tsx        ← 학교 검색·필터·선택
│   ├── GradeCareerForm.tsx       ← 학년 선택 + 진로 입력
│   ├── AIRecommendation.tsx      ← AI 분석 + 결과 표시
│   ├── SubjectList.tsx           ← 과목 목록 표시
│   ├── StepIndicator.tsx         ← 진행 단계 표시
│   └── ButterflyLogo.tsx         ← 나비 로고 SVG
│
├── lib/
│   ├── firebase.ts               ← Firebase 초기화
│   ├── firestore.ts              ← Firestore CRUD
│   ├── claude-api.ts             ← Claude API 호출
│   ├── career-api.ts             ← 커리어넷 API 호출
│   └── recommendation-engine.ts  ← 추천 로직 (로컬 폴백 포함)
│
├── functions/                    ← Cloud Functions (백엔드)
│   ├── src/
│   │   ├── index.ts
│   │   ├── neis-collector.ts     ← NEIS 데이터 수집 (스케줄)
│   │   ├── career-sync.ts        ← 커리어넷 데이터 동기화
│   │   ├── seed-data.ts          ← 초기 데이터 업로드
│   │   └── ai-recommend.ts       ← AI 추천 API 엔드포인트
│   └── package.json
│
├── data/
│   └── busan_all_subjects.json   ← 139개교 수집 데이터 (시드용)
│
├── public/
│   └── favicon.svg               ← 나비 아이콘
│
├── firebase.json                 ← Firebase 설정
├── firestore.rules               ← 보안 규칙
├── .env.local                    ← 환경변수 (API 키)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 디자인 시스템

### 컬러
- Primary: #0ea5e9 (Sky Blue)
- Secondary: #6366f1 (Indigo)
- Accent: #f59e0b (Amber)
- Success: #22c55e
- Danger: #ef4444
- Background: #ffffff
- Text: #0f172a / #64748b / #94a3b8

### 타이포그래피
- 한글: 'Noto Sans KR' (300, 400, 500, 700, 900)
- 영문: system-ui

### 브랜딩
- 로고: 나비 SVG (학점 + 나비 = 학점나비)
- 그라데이션: Sky Blue → Indigo (CTA 버튼, 배너)
- 앱 톤: 친근하고 밝은 교육 앱, 모바일 퍼스트

### 추천 결과 색상 체계
- 🔴 필수 과목: #ef4444 bg:#fef2f2
- 🟠 적극 추천: #f59e0b bg:#fffbeb
- 🟢 고려 과목: #22c55e bg:#f0fdf4
- ⚪ 후순위: #94a3b8 bg:#f8fafc

---

## Cloud Functions 스케줄

### NEIS 데이터 갱신 (매년 2회)
```
# 1학기 시작 (3월 둘째주)
exports.neisSync1 = functions.pubsub.schedule('0 6 8-14 3 1').onRun()

# 2학기 시작 (9월 첫주)
exports.neisSync2 = functions.pubsub.schedule('0 6 1 9 *').onRun()
```

### 커리어넷 데이터 갱신 (분기 1회)
```
exports.careerSync = functions.pubsub.schedule('0 3 1 */3 *').onRun()
```

---

## 환경변수 (.env.local)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEIS_API_KEY=6c28d23ebed746a7a1559a5976a459de
CAREER_API_KEY=[커리어넷 승인 후 입력]
ANTHROPIC_API_KEY=[Claude API 키]
```

---

## 구현 우선순위

1. ✅ Next.js + Firebase 프로젝트 초기 세팅
2. ✅ Firestore에 139개교 데이터 시드 업로드
3. ✅ 학교 검색·선택 페이지
4. ✅ 학년·진로 입력 페이지
5. ✅ Claude API 연동 AI 추천
6. ⬜ 커리어넷 API 연동 (승인 후)
7. ⬜ Firebase Auth 사용자 시스템
8. ⬜ NEIS 자동 갱신 Cloud Function
9. ⬜ PWA 설정 (모바일 앱처럼 사용)

---

## 참고: AI 추천 프롬프트

Claude API에 보내는 추천 요청 프롬프트:

```
당신은 한국 고등학교 교육과정 전문가이자 진로 상담 AI입니다.

학생 정보:
- 학교: {학교명} ({학교유형})
- 학년: {학년}학년
- 희망 진로: {진로}

이 학교의 실제 개설과목 데이터:
{학년별 과목 목록}

위 데이터를 기반으로 이 학생에게 최적의 과목 선택을 추천해주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "must_take": [{"subject":"과목명","reason":"이유"}],
  "recommended": [{"subject":"과목명","reason":"이유"}],
  "consider": [{"subject":"과목명","reason":"이유"}],
  "avoid": [{"subject":"과목명","reason":"이유"}],
  "strategy": "전체적인 과목 선택 전략 2-3문장",
  "career_tip": "진로 관련 팁 1-2문장"
}

중요: 반드시 이 학교에 실제 개설된 과목만 추천하세요!
```

---

## 시작 명령

Firebase Studio 터미널에서:

```bash
# 1. 프로젝트 생성
npx create-next-app@latest hakjeomnavi --typescript --tailwind --app --src-dir=false

# 2. Firebase 설정
npm install firebase firebase-admin
firebase init  # Firestore, Functions, Hosting 선택

# 3. 추가 패키지
npm install lucide-react  # 아이콘

# 4. 데이터 시드 (busan_all_subjects.json을 data/ 폴더에 넣은 후)
npx ts-node functions/src/seed-data.ts
```

이 문서와 함께 `busan_all_subjects.json` 파일을 Firebase Studio에 업로드하면,
Claude CLI가 전체 프로젝트를 자동 생성할 수 있습니다.
