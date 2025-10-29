# 🌍 새김 앱 다국어 지원 구현 가이드

## 개요

새김 앱에 한국어/영어 다국어 지원이 추가되었습니다. 이 문서는 구현된 다국어 시스템의 사용법을 설명합니다.

---

## 🎯 구현된 기능

### 1. **UI 다국어 지원**

- 모든 UI 텍스트(버튼, 메뉴, 메시지 등)가 한국어/영어로 번역됨
- 사용자가 언어를 선택하면 실시간으로 전체 UI가 변경됨
- 선택한 언어는 추후 백엔드 사용자 설정 API와 연동해 저장/복원될 예정

### 2. **AI 생성 콘텐츠 다국어 지원**

- AI가 생성하는 시/단편글이 선택한 언어로 생성됨
- 감정 분석 결과가 선택한 언어로 반환됨
- 키워드 추출 결과가 선택한 언어로 반환됨

### 3. **언어 전환 UI**

- Header와 Sidebar에 언어 전환 버튼 추가
- 드롭다운 메뉴로 한국어/영어 선택 가능
- 현재 선택된 언어가 표시됨

---

## 📁 프로젝트 구조

```
src/
├── lib/
│   └── i18n.ts                    # i18next 설정 파일
├── locales/
│   ├── ko.json                    # 한국어 번역
│   └── en.json                    # 영어 번역
├── stores/
│   └── language.ts                # 전역 언어 상태 관리 (Zustand)
├── components/
│   ├── ui/custom/
│   │   └── LanguageToggle.tsx     # 언어 전환 컴포넌트
│   ├── providers/
│   │   └── theme-provider.tsx     # I18nextProvider 설정
│   └── common/
│       ├── Header.tsx             # 헤더 (번역 적용)
│       └── Sidebar.tsx            # 사이드바 (번역 적용)
└── lib/api/
    └── ai.ts                      # AI API (language 파라미터 추가)
```

---

## 🔧 사용 방법

### 1. 컴포넌트에서 번역 사용하기

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.loading')}</h1>
      <button>{t('common.save')}</button>
      <p>{t('diary.noEntries')}</p>
    </div>
  );
}
```

### 2. 언어 변경하기

```typescript
import { useLanguageStore } from '@/stores/language';

function LanguageSelector() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value as 'ko' | 'en')}>
      <option value="ko">한국어</option>
      <option value="en">English</option>
    </select>
  );
}
```

> 📌 **앞으로의 변경 계획**
> 백엔드 사용자 설정 API가 준비되면 `setLanguage` 내부에서 DB에 선호 언어를
> 저장하도록 수정하고, API 응답으로 돌려받은 값을
> `setLanguageFromServer`로 동기화하면 됩니다.

### 3. AI API 호출 시 언어 전달

```typescript
import { useLanguageStore } from '@/stores/language';
import { aiApi } from '@/lib/api/ai';

function GenerateContent() {
  const { language } = useLanguageStore();

  const generate = async () => {
    const response = await aiApi.generateTextStream({
      prompt: '오늘 기분이 좋아',
      style: 'poem',
      length: 'medium',
      language: language, // 현재 선택된 언어 전달
    });
  };
}
```

**참고:** `useStreaming` 훅을 사용하는 경우, language는 자동으로 적용됩니다.

---

## 📝 번역 키 구조

번역 파일(`locales/ko.json`, `locales/en.json`)은 다음과 같은 구조를 가집니다:

```json
{
  "common": {
    "loading": "로딩 중...",
    "save": "저장",
    "cancel": "취소"
  },
  "nav": {
    "write": "글쓰기",
    "list": "글목록",
    "calendar": "캘린더"
  },
  "auth": {
    "email": "이메일",
    "password": "비밀번호",
    "login": "로그인"
  },
  "diary": {
    "write": "일기 쓰기",
    "list": "일기 목록"
  },
  "ai": {
    "generate": "생성",
    "regenerate": "재생성",
    "styles": {
      "poem": "시",
      "short_story": "단편글"
    }
  }
}
```

---

## 🎨 새로운 번역 추가하기

### 1. 번역 파일에 키 추가

**ko.json:**

```json
{
  "myFeature": {
    "title": "새 기능",
    "description": "이것은 새 기능입니다"
  }
}
```

**en.json:**

```json
{
  "myFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

### 2. 컴포넌트에서 사용

```typescript
const { t } = useTranslation();

return (
  <div>
    <h1>{t('myFeature.title')}</h1>
    <p>{t('myFeature.description')}</p>
  </div>
);
```

---

## 🚀 백엔드 API와의 연동

### AI 생성 API

백엔드 API는 `language` 파라미터를 받아 해당 언어로 콘텐츠를 생성합니다:

**요청:**

```json
{
  "prompt": "Today was a great day",
  "style": "poem",
  "length": "medium",
  "language": "en"
}
```

**응답:**

```json
{
  "type": "complete",
  "emotion": "happiness",
  "keywords": ["joy", "delight", "satisfaction"],
  "generated_text": "Today was a wonderful day..."
}
```

---

## 🔍 주의사항

### 1. 백엔드가 처리하는 것

✅ AI 생성 텍스트 (시, 단편글)
✅ 감정 분석 결과
✅ 키워드 추출 결과

### 2. 프론트엔드가 처리하는 것

✅ UI 텍스트 (버튼, 메뉴, 메시지)
✅ 에러 메시지
✅ 시스템 메시지

### 3. 감정 표시

백엔드가 이미 사용자가 선택한 언어에 맞춰 감정을 반환하므로, 프론트엔드에서는 **백엔드 응답을 그대로 표시**하면 됩니다.

```typescript
// ✅ 권장: 백엔드 응답 그대로 표시
<div>{response.emotion}</div>

// ❌ 불필요: 프론트엔드에서 번역하지 않음
<div>{t(`emotions.${response.emotion}`)}</div>
```

---

## 🧪 테스트

### 1. 언어 전환 테스트

1. Header 또는 Sidebar에서 언어 전환 버튼 클릭
2. 한국어 ↔ 영어 전환 확인
3. (백엔드 연동 전) 새로고침 시 기본 언어로 돌아오는지 확인

### 2. AI 생성 테스트

1. 언어를 영어로 변경
2. AI 텍스트 생성 실행
3. 생성된 텍스트, 감정, 키워드가 모두 영어인지 확인

### 3. UI 번역 테스트

1. 언어를 영어로 변경
2. 모든 페이지(글쓰기, 목록, 캘린더, 프로필)를 방문
3. 모든 UI 텍스트가 영어로 표시되는지 확인

---

## 📚 참고 문서

- [react-i18next 공식 문서](https://react.i18next.com/)
- [i18next 공식 문서](https://www.i18next.com/)
- [백엔드 다국어 API 가이드](./multilingual-api-guide.md)

---

## ❓ FAQ

### Q: 새로운 페이지에 번역을 추가하려면?

A:

1. `locales/ko.json`과 `locales/en.json`에 번역 키 추가
2. 컴포넌트에서 `useTranslation()` 훅 사용
3. `t('키.이름')` 형식으로 번역 텍스트 가져오기

### Q: 언어가 변경되지 않아요

A:

1. 언어 토글 클릭 시 로그나 네트워크 탭에서 오류가 발생하는지 확인
2. (백엔드 연동 후라면) 사용자 설정 API 호출이 성공했는지 확인
3. i18next 초기화에 전달되는 언어 코드가 의도한 값인지 점검

### Q: AI 생성 텍스트가 영어로 나오지 않아요

A:

1. 백엔드 API가 최신 버전인지 확인
2. API 요청에 `language` 파라미터가 포함되어 있는지 확인
3. 네트워크 탭에서 실제 전송되는 요청 확인

---

**구현 완료일:** 2025-10-01
**작성자:** Claude AI
**버전:** 1.0.0
