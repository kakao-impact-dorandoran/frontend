# 도란도란 Frontend 시연 가이드

> 이 문서는 FE-Final 시점의 **시연 / QA 운영자**용 가이드입니다. 새 기능을 어떻게 만들었는지가 아니라, 지금 빌드된 프론트엔드를 **어떻게 띄우고 어떤 순서로 시연하는지**, 그리고 시연 중 부딪힐 수 있는 **남은 placeholder / 주의사항**을 정리합니다.
>
> 기준 브랜치: `chore/final-qa-demo-guide` (main = FE-5M 머지 시점)
> 백엔드 핸드오프 원본: [`backend/docs/FRONTEND_API_HANDOFF.md`](../../../backend/docs/FRONTEND_API_HANDOFF.md)

---

## 1. 프로젝트 실행 방법

### 1.1 위치

- 부모 워크트리: `/workspace`
- 프론트 저장소: `/workspace/frontend`
- 실제 프로젝트 루트 (package.json): `/workspace/frontend/frontend`

### 1.2 명령어

```bash
cd /workspace/frontend/frontend

pnpm install          # 의존성 설치 (lockfile 그대로)
pnpm dev              # 개발 서버 (Vite, 기본 http://localhost:5173)
pnpm build            # 프로덕션 빌드 → dist/
```

> `package.json` 에 정의된 script 는 `dev`, `build` 두 개입니다. lint script 는 **없습니다**.

### 1.3 백엔드 실행 필요 여부

프론트는 **백엔드 없이는 사실상 시연 불가**합니다. 로그인부터가 `POST /api/v1/auth/login` 호출이며, 모든 대시보드 화면이 부팅 시점에 API 를 호출합니다. 백엔드가 꺼져 있으면 "서버에 연결할 수 없습니다." 토스트와 빈 카드만 보입니다.

백엔드 기동 절차는 [`backend/docs/BACKEND_RUNBOOK.md`](../../../backend/docs/BACKEND_RUNBOOK.md) 참고. 요약:

```bash
cd /workspace
docker compose up -d              # MySQL
cd /workspace/backend
./gradlew bootRun                 # http://localhost:8080
```

서버 부팅 시 `DataInitializer` 가 시연용 계정·어르신·기기·가능 시간을 자동 시드합니다.

---

## 2. 환경 변수

`.env.example` 과 `.env.development` 가 저장소에 들어 있고, 키는 단 한 개입니다.

| Key | 예시 값 | 비고 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | client 가 알아서 `/api/v1` prefix 를 붙입니다. 끝 슬래시는 제거됩니다. |

API client (`src/lib/api/client.ts`) 는 이 값을 base URL 로 사용하고, 미지정 시 `http://localhost:8080` 으로 fallback 합니다.

**민감정보 (실제 JWT, device token, 비밀번호) 는 본 문서나 .env 파일에 그대로 적지 마세요.** 시드 비밀번호와 device token 값은 backend handoff 문서에만 적혀 있고, 시연 시에는 백엔드 핸드오프를 참고해 즉석에서 입력합니다.

---

## 3. 라우트 / 권한 구조 점검 결과

### 3.1 라우트 트리 (`src/app/routes.tsx`)

| Path | 보호 | 구현 |
| --- | --- | --- |
| `/` | public | `Home` |
| `/login` | public | `Login` (이미 로그인 시 role 기본 경로로 자동 리다이렉트) |
| `/signup` | public | `Signup` |
| `/about`, `/pricing`, `/faq`, `/contact` | public | 정적 페이지 |
| `/youth`, `/youth/profile`, `/youth/myinfo`, `/youth/call`, `/youth/matching`, `/youth/schedule`, `/youth/conversations`, `/youth/journal`, `/youth/seniors` | `RequireAuth allowedRoles=["YOUTH"]` | 청년 전용 |
| `/guardian/dashboard`, `/guardian/senior-profile` | `RequireAuth allowedRoles=["GUARDIAN"]` | 보호자 전용 (이번 FE-Final 에서 추가 보호) |
| `/admin` | `RequireAuth allowedRoles=["ADMIN"]` | 관리자 전용 |
| `/senior` | public | 어르신 전용 기기 화면. JWT 가 아니라 **Device 토큰**으로 인증하므로 라우트 차원에서 일반 로그인은 막지 않음 (의도적). |
| `*` | public | `NotFound` |

### 3.2 인증 동작

`RequireAuth` (`src/lib/auth/RequireAuth.tsx`):

- `status === "idle" | "loading"` → 로딩 메시지
- 비인증 → `/login` 으로 `Navigate replace`, `from` state 보존
- role 불일치 → `routeForRole(user.role, user)` 로 자기 자신의 기본 경로로 보냄

`routeForRole` (`src/lib/auth/routes.ts`):

- ADMIN → `/admin`
- GUARDIAN → `/guardian/dashboard`
- YOUTH (`approvalStatus == null`) → `/youth/profile`
- YOUTH (그 외) → `/youth`

`Login` 페이지는 이미 로그인된 사용자를 위 규칙 또는 `state.from` 으로 자동 리다이렉트합니다. `Login` 의 `getSafeRedirectPath` 는 외부 URL / `/login` 자기참조를 막아 둡니다.

### 3.3 FE-Final 에서 점검 후 수정한 부분

- **`/guardian/*` 가드 누락 수정**: 기존 라우트 정의에 `RequireAuth` 가 빠져 있어 비로그인 또는 다른 role 도 보호자 화면이 보였음. `RequireAuth allowedRoles={["GUARDIAN"]}` 래퍼 추가.
- **`AdminDashboard` 로그아웃이 토큰을 지우지 않던 버그**: 사이드바 로그아웃이 `<Link to="/login">` 일 뿐이어서 토큰 / 사용자 상태가 그대로 남아 다시 접근 가능했음. `useAuth().logout()` 호출 후 `/login` 으로 navigate 하도록 변경.
- **`GuardianDashboard` 로그아웃 동작 동일 패치**: `navigate("/")` 만 호출하던 것을 `logout()` 후 `/` 로 이동하도록 변경.
- **`GuardianDashboard` 환영 배너 하드코딩 제거**: "최보호님 반가워요" 가 모든 보호자에게 표시되던 것을 `user.name` 기준으로 변경.

---

## 4. 역할별 시연 시나리오

각 역할은 **새 시크릿 창** (또는 다른 브라우저 프로필) 에서 진행하는 것을 권장합니다. localStorage 가 깨끗한 상태에서 출발해야 토큰 충돌이 없습니다.

추천 순서: 보호자 → 관리자 (청년 승인) → 청년 → 전용 기기.

### 4.1 청년 (YOUTH)

1. `/login` 진입 → `youth_approved` 계정으로 로그인. → 자동으로 `/youth` 이동.
2. 좌측 상단 "정보 수정" → `/youth/myinfo`. (※ 4.5 참고: 현재 로컬 state 만 동작하는 데모성 화면)
3. 메뉴 → "나의 프로필" (`/youth/profile`) 에서 자기소개·연락처를 등록/수정. 미가입(`approvalStatus == null`) 상태이면 로그인 직후 자동으로 이 화면으로 옵니다.
4. "매칭 관리" (`/youth/matching`) → 어르신 추천 카드. 검색·필터 시도, 카드에서 "매칭 신청" → 사전 인사말 입력 후 매칭 생성.
5. "어르신 연락하기" (`/youth/seniors`) → 매칭된 어르신 목록 / 상세 / 매칭 중단 요청 / 신고.
6. "일정 관리" (`/youth/schedule`) → 가능 시간 등록 후 일정 생성/조회/취소.
7. (백엔드 시드 기준: youth_approved + 어르신 박도란이 D+1 14:00~15:00 공통 가능 시간이 있어 일정 생성 데모 가능)
8. "활동 일지" (`/youth/journal`) → 완료된 일정 기준으로 통화 시간 / 난이도 / 소감 작성.
9. 상단 증명서 배너 → `/youth/conversations` 에서 누적 시간 / 발급 완료된 증명서 조회. (10시간 이상이면 발급 버튼 노출 — 시연 시 시드 데이터로는 충족 어려움, "여기서 발급 누르면 PDF 다운로드" 정도로 설명만)
10. `/youth/call` 은 SeniorTablet 이 발급한 "청년 접속 URL" 로 진입하는 화면이므로 단독 시연보다는 4.4(전용 기기) 와 묶어서 보여 줍니다.

#### 청년 승인 상태별 분기 (Login 다이얼로그)

- `PENDING` → "관리자 승인 대기 중" 다이얼로그.
- `REJECTED` → "프로필 반려 안내" 다이얼로그 + 프로필 수정 진입 버튼.
- `SUSPENDED` → "이용 제한 안내" 다이얼로그.

시드 계정 `youth_pending` / `youth_rejected` / `youth_banned` 으로 각각 재현 가능합니다.

### 4.2 보호자 (GUARDIAN)

1. `/login` → `guardian` 계정으로 로그인 → `/guardian/dashboard`.
2. 좌측 상단 "어르신 등록" (`/guardian/senior-profile`) → 3-step 폼 클릭 흐름 시연. **단, 이 화면은 현재 백엔드 등록 API 와 연결돼 있지 않은 정적 폼입니다** (placeholder 흐름 — §5 참고).
3. 대시보드에서 등록된 어르신 카드 선택. 어르신 가능 시간 등록 폼에서 날짜·시작·종료 시각 입력 후 등록.
4. 어르신 가능 시간 리스트 / 보호자 본인 일정 카드 확인.
5. "매칭 현황" 영역 → 매칭 카드 클릭 시 매칭 상세 다이얼로그. 상세에서 "매칭 중단 요청".
6. "청년 활동 일지" 카드 → 어르신과 매칭된 청년이 남긴 활동 기록 조회 (시드 청년이 활동 기록을 남긴 경우에 한해 표시).
7. 어르신 카드 우측 메뉴 → "신고하기" 다이얼로그.
8. 우측 상단 로그아웃 → `useAuth.logout()` 후 `/` 이동 (이번 작업에서 수정).

### 4.3 관리자 (ADMIN)

1. `/login` → `admin` 계정으로 로그인 → `/admin`.
2. 좌측 사이드바 메뉴 7개. 핵심 시연 메뉴는 다음 4개:
   - **대시보드**: 4개 KPI 카드 (승인 대기 / 도움 요청 / 매칭 중단 / 신고) + 운영 큐 요약.
   - **청년 가입 검수**: PENDING 청년 목록 / 상세 다이얼로그 / 승인·반려. 반려 시 사유 필수.
   - **운영 큐 처리**: 도움 요청 · 매칭 중단 · 신고 카드 3종. 도움 요청 "처리됨" 클릭, 매칭 중단 "승인 / 반려" + 메모, 신고 "해결 / 반려" + 메모. 신고 처리 후 "신고 대상 제재" 진입 가능.
   - **제재 관리**: 신고 화면에서 들어온 사용자 제재 다이얼로그. ("제재 관리" 탭 자체의 표는 mock — §5 참고)
3. 사이드바 하단 로그아웃 → `useAuth.logout()` 후 `/login` 이동 (이번 작업에서 수정).

### 4.4 전용 기기 (SeniorTablet)

전용 기기 화면은 일반 로그인이 아닌 **Device 토큰** 으로 동작합니다. 시연 컴퓨터의 화면을 큰 디스플레이에 띄워 두면 어르신 태블릿 UX 를 그대로 보여 줄 수 있습니다.

1. `/senior` 진입. 처음에는 "기기 토큰 미등록" 배지가 보이고, 토큰 입력 카드가 열려 있습니다.
2. 백엔드 시드의 `seed-device-token-0001` (또는 운영자가 발급한 토큰) 을 입력하고 "저장". → 토큰은 sessionStorage 에 임시 저장됩니다 (탭 닫으면 사라짐).
3. 토큰이 유효하면 자동으로 `GET /api/v1/device/main` 호출 → 어르신 이름 / 오늘 일정 카드 / 통화 버튼 3개 활성화.
4. 오늘 확정된 일정이 없으면 아래쪽 입력란에 `matchId` (필수) + `scheduleId` (선택) 를 직접 입력해 즉시 통화 모드로 진입할 수 있습니다.
5. "얼굴 보며 전화하기" → `startCallByDevice("VIDEO")` → 통화 진행 화면. 우측 상단에 callLogId / matchId / scheduleId 가 디버그용으로 노출됩니다.
6. "청년 접속 링크 복사" 버튼 → 청년 측 시연 브라우저에서 해당 링크 (`/youth/call?callLogId=...&matchId=...&type=video`) 를 열어 청년 측 통화 화면 시연 가능.
7. "끊기" → `endCallByDevice` → status `ENDED` 로 종료. "홈으로" 로 메인 복귀.
8. "도움 요청하기" → 도움 유형 선택 → `POST /api/v1/help-requests` (device 인증) → 접수 알림 카드.
9. 우측 상단 "토큰 삭제" 로 등록 해제. 다시 토큰 입력 카드가 열립니다.

> 실제 WebRTC 영상/음성은 화면 표현(이미지·아이콘) 으로만 시연합니다. 백엔드는 통화 로그만 관리합니다.

### 4.5 권한 격리 시연 팁

- 청년 계정으로 로그인한 뒤 주소창에 `/admin` 또는 `/guardian/dashboard` 를 직접 입력해 보세요. `RequireAuth` 가 `routeForRole(user.role, user)` 로 자동 리다이렉트해 청년 대시보드로 돌려보냅니다.
- 비로그인 상태에서 `/youth` / `/admin` / `/guardian/dashboard` 접근 → `/login` 으로 이동하면서 `state.from` 보존. 로그인 성공 직후 원래 페이지로 복귀.

---

## 5. 남아 있는 mock / placeholder / 미연결 영역

> 정책: 시연에서 **설명만 하고 넘어가기**. 새 API 연동은 FE-Final 범위 밖.

### 5.1 시연 영향 큼 — 사전에 설명해야 부자연스럽지 않음

| 위치 | 상태 | 시연 멘트 안내 |
| --- | --- | --- |
| `AdminDashboard.tsx` `allUsers` (제재 관리 탭) | 정적 mock 배열 (`Y001`, `Y004`, `G001`...). 검색은 mock 내부에서만 동작. | "이 표는 운영자 전용 사용자 검색 화면 데모입니다. 실제 제재는 **운영 큐 처리 → 신고 카드 → 제재** 경로에서 진행합니다." |
| `AdminDashboard.tsx` `matchings`, `certificates`, `youthCertStatus`, `devices` (매칭 관리 / 증명서 현황 / 기기 상태 탭) | 정적 mock 배열. | "운영자 모니터링 뷰입니다. v2.0 백엔드 API 가 아직 없는 부분이라 데모용 표만 띄워 둡니다." |
| `SeniorProfileSetup.tsx` (보호자 → 어르신 등록 폼) | 모든 step 이 로컬 state 만 갱신. 백엔드 `POST /api/v1/elders` 미연결. | "어르신 등록 UX 시연용 화면입니다. 시연 시점에는 시드된 어르신 (`박도란`) 으로 진행합니다." |
| `YouthMyInfo.tsx` (청년 내 정보 수정) | 모든 필드 하드코딩 + 저장은 toast 만. | "회원 기본 정보 수정 UI 데모입니다. 본 시연에서는 청년 프로필(`/youth/profile`) 측으로 자기소개만 시연합니다." |
| 카카오·네이버·구글 소셜 로그인 버튼 (`Login.tsx`) | 클릭 시 "소셜 로그인은 아직 준비 중입니다." 토스트. | "소셜 로그인은 향후 작업 항목으로 비활성 처리해 두었습니다." |

### 5.2 시연 영향 낮음 — 자연스러운 빈 상태 / 정보성

| 위치 | 상태 |
| --- | --- |
| `YouthDashboard` 알림 벨 `unreadCount = 2` 하드코딩 | 알림 패널 자체는 정적 데모 컴포넌트. 시연 시 무시. |
| `GuardianDashboard` "전용 기기 현황 / 배송 상태 확인" 카드 | 정적 카드, 클릭 동작 없음. 보호자 측 기기 배송 모듈 미연결. |
| 활동 일지 / 매칭 / 일정 등의 "아직 ~ 가 없습니다" 빈 상태 메시지 | 정상 동작. 데이터 없을 때만 노출됨. |
| `YouthConversations` 의 "아직 PDF 파일이 준비되지 않았습니다" 안내 | 증명서가 발급되었지만 `fileUrl` 이 null 인 케이스의 UI. 백엔드 측에서 발급된 PDF URL 이 채워지면 자동 동작. |

### 5.3 백엔드 API 부재 / 의도적 후순위

| 항목 | 상태 |
| --- | --- |
| 매칭 운영 모니터링 (관리자 매칭 표) | v2.0 백엔드에 admin matching 목록 API 가 없음 → mock 유지. |
| 운영자 전용 사용자 검색 (관리자 제재 표) | admin user search API 없음 → mock 유지. 실 제재는 신고 → 제재 경로로만. |
| 운영자 전용 증명서 발급 현황 표 | admin certificate 목록 API 없음 → mock 유지. |
| 운영자 기기 배송 상태 관리 | 백엔드 admin device 관리 API 없음 → mock 유지. |
| 보호자 어르신 등록 폼 (`SeniorProfileSetup`) | 백엔드 `POST /api/v1/elders` 는 존재하지만 본 화면은 step UX 데모 단계, 실 등록은 운영자/seed 가정. |
| 보호자 비밀번호 변경 / 청년 비밀번호 변경 | toast 만 발생. 백엔드 endpoint 미연결 (의도적 후순위). |
| 청년 알림 패널 | 정적 데모. 알림 API 미연결. |
| 소셜 로그인 (Kakao / Naver / Google) | 백엔드 미구현, UI 도 toast 안내만. |

---

## 6. 시연 전 체크리스트

- [ ] `cd /workspace/frontend/frontend && pnpm install` 정상 종료
- [ ] `pnpm build` 성공 (FE-Final 시점 ✅ 확인됨)
- [ ] 백엔드 기동 확인: `curl http://localhost:8080/actuator/health` 또는 Swagger UI 접근
- [ ] `VITE_API_BASE_URL` 가 시연 머신의 백엔드 주소를 가리키는지 확인 (기본 `http://localhost:8080`)
- [ ] 백엔드 `DataInitializer` 시드 데이터가 들어가 있는지 (백엔드 핸드오프 §5 참고)
- [ ] 시연 브라우저 별도 시크릿 창 4개 준비 (청년 / 보호자 / 관리자 / 어르신 기기)
- [ ] 어르신 기기 화면을 띄울 디스플레이/태블릿 + 청년 측 통화 화면을 띄울 추가 창
- [ ] 백엔드 핸드오프 §5 의 시드 계정·device token 정보를 즉석 입력 가능하도록 사이드 노트에 준비 (문서에는 적어 두지 않음)
- [ ] 시연 전 청년 승인 다이얼로그 (`pending`, `rejected`, `suspended`) 도 한 번 띄워 보고 확인
- [ ] 전용 기기 화면에서 "청년 접속 URL 복사" 가 정상 복사되는지 (https 환경 / clipboard API 사용 가능 여부)

---

## 7. 알려진 빌드/런타임 메모

- `pnpm build` 결과 `dist/assets/*.js` 약 912kB (gzip 254kB). 코드 스플리팅이 안 되어 있어 첫 진입이 다소 무겁지만 시연에는 문제 없음.
- React Router v7 (`react-router` 7.13.0) 사용. `createBrowserRouter` 라 새로고침/딥링크 정상 동작.
- 토큰 저장 위치: localStorage (`src/lib/auth/storage.ts`). device token 은 sessionStorage (`src/lib/device/token.ts`).
- 글로벌 fetch wrapper (`apiRequest`) 가 401/403 응답 본문의 `code` 를 그대로 `ApiError.code` 로 노출하므로, 화면별 에러 매핑은 백엔드 핸드오프 §4 의 ErrorCode 표와 1:1 로 맞춰 두었습니다.

---

## 8. 참고 링크

- 백엔드 핸드오프: [`backend/docs/FRONTEND_API_HANDOFF.md`](../../../backend/docs/FRONTEND_API_HANDOFF.md)
- 백엔드 실행 절차: [`backend/docs/BACKEND_RUNBOOK.md`](../../../backend/docs/BACKEND_RUNBOOK.md)
- 인증 가드: [`src/lib/auth/RequireAuth.tsx`](../src/lib/auth/RequireAuth.tsx) · [`src/lib/auth/routes.ts`](../src/lib/auth/routes.ts)
- API client: [`src/lib/api/client.ts`](../src/lib/api/client.ts)
