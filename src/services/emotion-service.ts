import { EmotionOption } from '@/stores/emotion';

// 감정 분석 서비스
export class EmotionService {
  static detectEmotion(text: string): EmotionOption {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('기쁨') ||
      lowerText.includes('행복') ||
      lowerText.includes('즐거')
    ) {
      return 'happy';
    }

    if (
      lowerText.includes('슬픔') ||
      lowerText.includes('우울') ||
      lowerText.includes('눈물')
    ) {
      return 'sad';
    }

    if (
      lowerText.includes('화') ||
      lowerText.includes('분노') ||
      lowerText.includes('짜증')
    ) {
      return 'angry';
    }

    if (
      lowerText.includes('당황') ||
      lowerText.includes('걱정') ||
      lowerText.includes('불안')
    ) {
      return 'unrest';
    }

    if (
      lowerText.includes('평온') ||
      lowerText.includes('고요') ||
      lowerText.includes('조용')
    ) {
      return 'peaceful';
    }

    return 'peaceful'; // 기본값
  }

  static getEmotionTone(emotion: EmotionOption): string {
    const toneMap: Record<EmotionOption, string> = {
      happy: '기쁨이 배어있는',
      sad: '슬픔이 배어있는',
      angry: '분노가 배어있는',
      unrest: '불안한',
      peaceful: '평온한',
      '': '담담한',
    };

    return toneMap[emotion] || '담담한';
  }
}
