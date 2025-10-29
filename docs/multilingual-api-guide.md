ㅣ# 🌍 새김 앱 백엔드 다국어 지원 API 가이드

## 📋 개요

백엔드의 모든 AI 관련 API에 다국어(한국어/영어) 지원이 추가되었습니다.

---

## 🔧 변경된 API 목록

### 1. AI 텍스트 생성 API

**Endpoint:** `POST /api/ai/generate/stream`

#### 요청 파라미터

```json
{
  "prompt": "사용자 입력 텍스트",
  "style": "poem", // "poem" | "short_story"
  "length": "medium", // "short" | "medium" | "long"
  "language": "ko" // ⭐ 새로 추가: "ko" | "en" (기본값: "ko")
}
```

#### 응답 예시 (한국어)

```json
{
  "type": "complete",
  "emotion": "행복",
  "keywords": ["기쁨", "만족", "즐거움"],
  "generated_text": "오늘은 참 좋은 날이었다...",
  "tokens_used": 150,
  "session_id": "uuid-string"
}
```

#### 응답 예시 (영어)

```json
{
  "type": "complete",
  "emotion": "happiness",
  "keywords": ["joy", "satisfaction", "delight"],
  "generated_text": "Today was a wonderful day...",
  "tokens_used": 150,
  "session_id": "uuid-string"
}
```

---

### 2. AI 텍스트 재생성 API

**Endpoint:** `POST /api/ai/regenerate/{session_id}/stream`

- 이전 세션의 `language` 설정을 자동으로 유지
- 별도로 `language` 파라미터를 전달할 필요 없음

---

### 3. 원본 입력 조회 API

**Endpoint:** `GET /api/ai/session/{session_id}/original-input`

- 언어와 무관하게 동작
- 응답에 원본 입력 텍스트 포함

---

## 🌍 감정 타입 다국어 매핑

| 한국어 | 영어      | 의미                   |
| ------ | --------- | ---------------------- |
| 행복   | happiness | 기쁨, 만족, 즐거움     |
| 슬픔   | sadness   | 우울, 서운함, 아쉬움   |
| 화남   | anger     | 분노, 짜증, 억울함     |
| 평온   | peace     | 차분함, 안정감, 편안함 |
| 불안   | anxiety   | 걱정, 두려움, 긴장     |

---

## 🔄 하위 호환성

**기존 API 호출 방식은 100% 호환됩니다.**

```json
// ✅ 기존 방식 (language 없음) → 자동으로 한국어 처리
{
  "prompt": "오늘 기분이 좋아",
  "style": "poem",
  "length": "medium"
}

// ✅ 새로운 방식 (영어 지원)
{
  "prompt": "I feel great today",
  "style": "poem",
  "length": "medium",
  "language": "en"
}
```

---

## 💻 프론트엔드 구현 가이드

### React/TypeScript 예시

```typescript
// 1. 타입 정의
interface AIGenerateRequest {
  prompt: string;
  style: 'poem' | 'short_story';
  length: 'short' | 'medium' | 'long';
  language?: 'ko' | 'en'; // 선택적 파라미터
}

interface AIResponse {
  type: string;
  emotion: string;
  keywords: string[];
  generated_text: string;
  session_id: string;
}

// 2. API 호출 함수
const generateAIText = async (
  request: AIGenerateRequest,
  userLanguage: 'ko' | 'en',
): Promise<AIResponse> => {
  const response = await fetch('/api/ai/generate/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...request,
      language: userLanguage, // 사용자 언어 설정
    }),
  });

  // SSE 스트리밍 처리
  // ...
};

// 3. 사용 예시
const handleGenerate = async () => {
  const currentLanguage = i18n.language; // 'ko' or 'en'

  const result = await generateAIText(
    {
      prompt: userInput,
      style: 'poem',
      length: 'medium',
      language: currentLanguage,
    },
    currentLanguage,
  );

  console.log(result.emotion); // "happiness" or "행복"
};
```

### Flutter/Dart 예시

```dart
// 1. 모델 정의
class AIGenerateRequest {
  final String prompt;
  final String style;
  final String length;
  final String? language;

  AIGenerateRequest({
    required this.prompt,
    required this.style,
    required this.length,
    this.language = 'ko',
  });

  Map<String, dynamic> toJson() => {
    'prompt': prompt,
    'style': style,
    'length': length,
    'language': language,
  };
}

// 2. API 호출
Future<AIResponse> generateAIText(
  AIGenerateRequest request,
  String userLanguage
) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/ai/generate/stream'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      ...request.toJson(),
      'language': userLanguage,
    }),
  );

  // SSE 스트리밍 처리
  // ...
}
```

---

## 🧪 테스트 방법

### 1. 한국어 테스트

```bash
curl -X POST "http://localhost:8000/api/ai/generate/stream" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "오늘 행복했던 일",
    "style": "poem",
    "length": "medium",
    "language": "ko"
  }'
```

**예상 응답:**

- emotion: "행복" (한국어)
- keywords: ["기쁨", "즐거움", ...] (한국어)
- generated_text: 한국어로 생성된 시

### 2. 영어 테스트

```bash
curl -X POST "http://localhost:8000/api/ai/generate/stream" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Happy moments today",
    "style": "poem",
    "length": "medium",
    "language": "en"
  }'
```

**예상 응답:**

- emotion: "happiness" (영어)
- keywords: ["joy", "delight", ...] (영어)
- generated_text: 영어로 생성된 시

---

## 📌 중요 참고사항

### 1. 백엔드 처리 범위

✅ **백엔드에서 처리:**

- AI 생성 텍스트 (시, 단편글 등)
- 감정 분석 결과
- 키워드 추출 결과

❌ **백엔드에서 처리 안 함:**

- UI 텍스트 (버튼, 라벨, 메뉴 등)
- 에러 메시지
- 시스템 메시지

### 2. 프론트엔드 필수 작업

프론트엔드에서 반드시 구현해야 할 것:

1. **i18n 라이브러리 설정**
   - React: `react-i18next`
   - Vue: `vue-i18n`
   - Flutter: `flutter_localizations`

2. **UI 번역 파일 작성**

   ```json
   // ko.json
   {
     "diary": {
       "write": "일기 쓰기",
       "emotion": "감정",
       "keywords": "키워드"
     }
   }

   // en.json
   {
     "diary": {
       "write": "Write Diary",
       "emotion": "Emotion",
       "keywords": "Keywords"
     }
   }
   ```

3. **언어 설정 UI**
   - 사용자가 한국어/영어 선택 가능한 UI
   - 선택한 언어를 로컬 스토리지에 저장
   - API 호출 시 해당 언어 전달

4. **감정 표시 처리**

   ```typescript
   // ❌ 백엔드 응답을 그대로 표시 (언어 혼재 가능)
   <div>{response.emotion}</div>

   // ✅ 프론트엔드에서 번역 (권장하지 않음, 백엔드가 이미 처리)
   <div>{t(`emotions.${response.emotion}`)}</div>

   // ✅ 백엔드 응답 그대로 사용 (권장)
   // 백엔드가 이미 language에 맞춰 반환하므로 그대로 표시
   <div>{response.emotion}</div>
   ```

---

## 🚨 주의사항

### 1. 세션 ID 관리

- 재생성 시 이전 세션의 language가 자동 적용됨
- 세션 ID는 클라이언트에서 관리 필요

### 2. 스트리밍 처리

- SSE(Server-Sent Events) 방식으로 응답
- 청크별로 수신하여 UI 업데이트 필요

### 3. 에러 처리

```json
// 에러 응답 예시
{
  "type": "error",
  "error": "재생성 횟수가 5회를 초과했습니다."
}
```

---

## 📞 문의 및 지원

구현 중 문제가 발생하면:

1. 백엔드 로그 확인
2. API 요청/응답 확인
3. 백엔드 팀에 문의

---

## 📅 업데이트 이력

- **2025-10-01**: 다국어 지원 기능 추가 (한국어/영어)
  - AI 텍스트 생성 API
  - 감정 분석
  - 키워드 추출
