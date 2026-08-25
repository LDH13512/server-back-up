# 교육·전시용 복제본

이 폴더는 운영 사이트의 사용자 데이터와 연결 정보를 포함하지 않는 별도 복제본입니다.

## 적용된 격리

- 게시판과 모든 Firestore 기반 미니게임은 `backup-fcf14` 프로젝트를 사용합니다.
- 스케치북의 레거시 연결도 `backup-fcf14`로 고정해 운영 데이터에 접근하지 않습니다.
- 운영 Git 이력, Vercel 연결 정보, 로컬 비밀키, 설치·빌드·임시 산출물은 복사하지 않았습니다.
- 외부 커뮤니티 연동, 실시간 방 게임과 관련 예약 작업을 제거했습니다.
- 운영 도메인과 개인 이메일은 각각 `backup.example`, `admin@example.com`으로 대체했습니다.

## 로컬 실행

```powershell
npm install
npm run dev
```

`.env.local`에는 제공받은 공개 Firebase Web 설정만 들어 있습니다. 기본 게시판과 미니게임 실행에는 Firebase 서비스 계정이 필요하지 않습니다. Gemini와 Upstash 같은 선택 기능의 서버 비밀값은 비워 두었습니다.

## Firebase 콘솔에서 필요한 설정

1. `backup-fcf14`에서 익명 인증과 Firestore를 활성화합니다.
2. 앞서 안내한 Firestore 보안 규칙을 게시합니다.
3. 배포할 때 `backup.example`과 `admin@example.com`은 전시용 도메인·연락처로 교체합니다.

미니게임 순위를 매일 자동 초기화하려는 경우에만 배포 환경에 `backup-fcf14`의 서비스 계정을 `BACKUP_FIREBASE_SERVICE_ACCOUNT`로, 별도의 임의 문자열을 `BACKUP_CRON_SECRET`로 설정합니다. 이 기능을 사용하지 않으면 둘 다 비워 두어도 됩니다.

Firebase 보안 규칙은 콘솔에서 교육·전시 범위에 맞게 별도로 설정해야 합니다. 실제 사용자 개인정보나 운영 데이터는 이 프로젝트로 옮기지 않는 것을 전제로 합니다.
