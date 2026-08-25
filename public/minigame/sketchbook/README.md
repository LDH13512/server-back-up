# 스케치북 v4

## 동작 원칙

- 주제어 문서 ID와 그림 문서 ID를 같은 결정적 ID로 사용합니다.
- `runTransaction` 안에서 예약과 저장을 확인하므로 주제어 하나에는 그림 하나만 생성됩니다.
- 그림 예약은 20분 뒤 자동으로 만료됩니다.
- 완성된 그림과 사용자가 제안한 주제어는 주기적으로 삭제하지 않습니다.
- 새 그림은 640px 이하 WebP(미지원 브라우저는 JPEG)로 압축하며, Firestore 문서 한도보다 충분히 작게 저장합니다.
- 기존 `drawings`와 `user_words` 컬렉션은 삭제하거나 수정하지 않습니다. 기존 그림 중 주제어별 가장 오래된 한 장을 대표 그림으로 연결합니다.
- 교육·전시 복제본에서는 레거시 설정도 `backup-fcf14`로 고정하며, 외부 프로젝트의 그림 데이터를 읽지 않습니다.

## 주제어를 추가하는 가장 쉬운 방법

기본 주제어는 `prompts.js`의 `PROMPT_GROUPS`에 분류별로 추가합니다.
별도의 버전 숫자를 바꿀 필요는 없습니다. 앱이 목록 지문을 계산하고 새 단어만 자동으로 Firestore에 등록합니다.

주제어 작성 기준:

1. 한 장에 바로 그릴 수 있는 구체적인 한글 명사를 사용합니다.
2. 문장, 추상 개념, 상표명, 고유명사는 피합니다.
3. 같은 단어를 중복해서 넣지 않습니다.
4. 한글 1~8자를 권장합니다.

가용 주제어가 40개 미만이 되면 서버의 `sketchbook-word-batch` AI 요청으로 단어를 보충합니다. 이미 등록된 단어 목록을 함께 보내 중복 생성을 줄이고, 실패 시 30분 뒤 다시 시도합니다.

## Firestore 경로

- 주제어: `artifacts/{appId}/public/data/sketch_prompts/{promptId}`
- 대표 그림: `artifacts/{appId}/public/data/sketch_drawings/{promptId}`
- 이전 그림(읽기 전용): `artifacts/{appId}/public/data/drawings/{legacyId}`
- 이전 주제어(읽기 전용): `artifacts/{appId}/public/data/user_words/{legacyId}`
- 이전 및 보충 상태: `artifacts/{appId}/public/data/config/*`

## 기존 그림 다시 연결하기

두 Firebase 환경변수가 준비된 상태에서 아래 명령을 실행할 수 있습니다.

```powershell
npm run sketchbook:migrate
```

이 명령은 여러 번 실행해도 이미 만들어진 주제어와 그림을 덮어쓰지 않습니다.
기존 Firebase 문서는 읽기만 하며 삭제하거나 수정하지 않습니다.

## 배포 전 Firebase 규칙 확인

저장소에는 현재 운영 중인 Firestore 규칙 원본이 없습니다. Firebase Console의 규칙에서 익명 인증 사용자의 위 경로 읽기와 필요한 트랜잭션 쓰기가 허용되어야 합니다.

동시에 다음 제한을 규칙에 합치는 것을 권장합니다.

- `sketch_drawings/{promptId}`는 인증 사용자에게 최초 생성만 허용하고 삭제와 그림 본문 교체는 금지
- 그림 수정은 `correctCount` 증가만 허용
- 그림의 `promptId`와 문서 ID가 같아야 함
- 주제어의 `word`, `wordKey`, `drawingId`는 완성 후 변경 금지
- 이미지 문자열 크기와 허용 필드를 제한

규칙을 바꿀 때는 기존 게시판과 다른 미니게임 경로를 덮어쓰지 말고 현재 규칙에 위 조건만 병합해야 합니다.
