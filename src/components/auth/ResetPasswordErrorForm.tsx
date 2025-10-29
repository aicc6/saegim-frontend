'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TEXT_STYLES } from '@/constants';

export default function ResetPasswordErrorForm() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleResendEmail = () => {
    router.push('/forgot-password');
  };

  const handleGoToHelp = () => {
    router.push('/support');
  };

  return (
    <div className="space-y-6 text-center">
      {/* 에러 아이콘 */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <span
            className="text-4xl"
            role="img"
            aria-label={t('auth.resetPasswordErrorForm.warningLabel')}
          >
            ⚠️
          </span>
        </div>
      </div>

      {/* 에러 메시지 */}
      <div className="space-y-2">
        <h1 className={TEXT_STYLES.heading.h1}>
          {t('auth.resetPasswordErrorForm.title')}
        </h1>
        <p className={TEXT_STYLES.secondary}>
          {t('auth.resetPasswordErrorForm.descriptionLine1')}
          <br />
          {t('auth.resetPasswordErrorForm.descriptionLine2')}
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className="space-y-4 pt-4">
        {/* 에러 표시 카드 */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className={TEXT_STYLES.error}>
            {t('auth.resetPasswordErrorForm.notice')}
          </p>
        </div>

        {/* 이메일 재설정 버튼 */}
        <button
          onClick={handleResendEmail}
          className="w-full saegim-button saegim-button-large"
        >
          {t('auth.resetPasswordErrorForm.resendButton')}
        </button>

        {/* 고객센터 문의 버튼 */}
        <button
          onClick={handleGoToHelp}
          className={`w-full ${TEXT_STYLES.button.secondary}`}
        >
          {t('auth.resetPasswordErrorForm.supportButton')}
        </button>
      </div>
    </div>
  );
}
