# 새 미니게임 추가 안내

단일 리더보드를 사용하는 새 게임은 게임 폴더를 먼저 배포한 뒤
게시판의 `관리자 → 미니게임 관리`에서 등록할 수 있습니다.
등록 정보는 메인 Firebase의 `minigames` 컬렉션에 저장되며 게시판 표시와
리더보드 자동 초기화에 함께 반영됩니다.

새 게임을 추가할 때 `reset-arcade.js`나 `MiniGameModal.jsx`에 게임 정보를
복사해서 넣지 마세요. 기본 게임과 관리자 등록 게임을 합치는 규칙은
`src/config/minigames.js`에서 한 번만 관리합니다.

## 1. 게임 파일 만들기

다음 경로에 게임의 시작 파일을 둡니다.

```text
public/minigame/<게임 id>/index.html
```

예를 들어 게임 id가 `newgame`이라면 경로는 다음과 같습니다.

```text
public/minigame/newgame/index.html
```

`id`는 영문, 숫자, 하이픈(`-`), 밑줄(`_`)만 사용하는 것을 권장합니다.
폴더명과 설정의 `id`는 정확히 같아야 합니다.

Firebase 설정값을 게임 HTML에 직접 적지 마세요. 기존 게임과 동일하게
`<head>` 안에서 다음 런타임 설정을 먼저 불러옵니다.

```html
<script src="/_runtime/firebase-config?app=minigame"></script>
```

그다음 게임 모듈에서 `_mg_fbc`를 이용하거나
`window.__PLAYGROUND_FIREBASE_MINIGAME_CONFIG__`를 이용해 Firebase를
초기화할 수 있습니다.

## 2. 리더보드 저장 경로 결정하기

리더보드가 하나인 게임의 기본 경로는 다음과 같습니다.

```text
artifacts/<게임 id>/public/data/leaderboard
```

`newgame`의 예시는 다음과 같습니다.

```js
const leaderboardPath = [
  'artifacts',
  'newgame',
  'public',
  'data',
  'leaderboard',
];
```

관리자 화면에서 `id`, `name`, `label`만 입력해 등록하면 위의 기본 경로가
자동 적용됩니다. 따라서 게임 HTML도 반드시 같은 경로에 기록을 저장해야
합니다. 경로가 다르면 게시판은 다른 리더보드를 읽고, 자동 초기화도
실제 기록을 삭제하지 못합니다.

## 3. 관리자 화면에서 등록하기

게임 폴더를 커밋하고 배포한 다음 관리자 화면으로 들어갑니다.

1. `관리자 → 미니게임 관리`를 엽니다.
2. `ID`에 폴더명을 입력합니다. 예: `newgame`
3. `NAME`에 게시판 표시명을 입력합니다. 예: `🎮 새 게임`
4. `LABEL`에 1위 칭호를 입력합니다. 예: `새게임왕`
5. `새 게임 등록`을 누릅니다.

등록 버튼은 `/minigame/<ID>/index.html`이 실제로 배포되어 있는지 먼저
확인합니다. 파일이 없으면 Firebase에 게임 정보를 저장하지 않습니다.

등록이 완료되면 다음 항목이 자동 적용됩니다.

- 게임 주소: `/minigame/newgame/index.html`
- Firebase 경로: `artifacts/newgame/public/data/leaderboard`
- 게시판의 요일별 게임 표시
- 해당 게임이 선택된 날의 리더보드 자동 초기화
- 관리자의 전체 미니게임 리더보드 초기화

관리자 화면에서 등록을 삭제해도 게임 파일과 기존 Firebase 기록은
삭제되지 않습니다. 게시판 로테이션과 자동 초기화 목록에서만 빠집니다.

## 4. `minigames.js`를 직접 수정해야 하는 경우

다음 경우에는 관리자 화면의 간단 등록 대신
`src/config/minigames.js`의 `RAW_GAMES`에 직접 등록합니다.

- 점수와 시간 등 리더보드가 두 개 이상인 게임
- 기본 경로가 아닌 기존 Firebase 컬렉션을 사용하는 게임
- 시간이 짧을수록 높은 순위인 게임

리더보드가 여러 개인 설정 예시는 다음과 같습니다.

```js
{
  id: 'newgame',
  name: '🎮 새 게임',
  ranks: [
    {
      key: 'newgame-score',
      label: '점수왕',
      path: [
        'artifacts',
        'newgame',
        'public',
        'data',
        'leaderboard_s'
      ]
    },
    {
      key: 'newgame-time',
      label: '시간왕',
      path: [
        'artifacts',
        'newgame',
        'public',
        'data',
        'leaderboard_t'
      ],
      isTime: true
    }
  ]
}
```

- `key`: 전체 게임에서 중복되지 않는 내부 식별자
- `label`: 게시판에 표시할 우승자 이름
- `path`: 게임이 실제 기록을 저장하는 Firestore 컬렉션 경로
- `isTime: true`: 시간이 짧을수록 높은 순위인 기록에만 사용

직접 등록한 게임은 관리자 화면의 등록 목록에는 나오지 않지만
`기본 게임`으로 표시되며 동일하게 로테이션과 자동 초기화에 포함됩니다.

## 5. 설정 검사하기

프로젝트 폴더의 PowerShell에서 실행합니다.

```powershell
npm run minigames:check
```

이 검사는 다음 항목을 확인합니다.

- 게임 id 중복 여부
- 게임 폴더와 `index.html` 존재 여부
- 리더보드 key 및 Firebase 경로 중복 여부
- 필수 정보 누락 여부
- 기본 게임 기준 앞으로 7일 동안의 초기화 대상

이 명령은 코드에 포함된 기본 게임을 검사합니다. 관리자 화면에서 등록한
게임은 등록할 때 브라우저에서 별도로 검사됩니다. GitHub의 일일 초기화
작업도 기본 설정 검사를 먼저 실행하며, 잘못된 설정이면 리더보드를
삭제하지 않고 중단합니다.

## 6. 동작 원리

기본 게임과 관리자 등록 게임은 항상 같은 순서로 합쳐집니다. 다음 세 곳은
모두 `src/config/minigames.js`의 같은 선택 함수를 사용합니다.

1. 게시판의 요일별 게임 표시
2. GitHub 예약 리더보드 초기화
3. 예약 작업이 누락됐을 때 사이트 방문 시 수행하는 보조 초기화

초기화 완료 기록에는 KST 날짜, 절대 일수, 게임 id가 함께 저장됩니다.
날짜는 같지만 게임 id가 다르면 잘못된 초기화로 판단하고 오늘 게임을
다시 초기화합니다. 따라서 새 게임을 추가해 게임 순서가 달라진 경우에도
잘못된 게임의 초기화 기록을 완료로 인정하지 않습니다.

## 7. 배포 전 확인 목록

- 게임 폴더명과 `id`가 같은가?
- 게임 HTML에 Firebase 키를 직접 넣지 않았는가?
- 게임이 쓰는 리더보드 경로와 `path`가 같은가?
- 단일 기본 경로 게임이라면 관리자 화면에서 등록했는가?
- 시간 기록이라면 `isTime: true`를 넣었는가?
- `key`와 Firebase 경로가 다른 게임과 겹치지 않는가?
- `npm run minigames:check`가 성공하는가?
- `npm run build`가 성공하는가?
