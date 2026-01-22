import { useI18n } from '../i18n/useI18n';

interface LoadingIndicatorProps {
  label?: string;
  size?: 'sm' | 'md';
}

export function LoadingIndicator({ label, size = 'md' }: LoadingIndicatorProps) {
  const { t } = useI18n();
  const spinnerSize = size === 'sm' ? 'w-4 h-4 border-2' : 'w-6 h-6 border-[3px]';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="flex items-center gap-2 text-gray-500" role="status" aria-live="polite">
      <span
        className={`${spinnerSize} border-gray-300 border-t-primary rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className={textSize}>{label ?? t('Загрузка...')}</span>
    </div>
  );
}
