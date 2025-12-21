import { useCallback, useEffect, useState } from 'react';
import logo from 'figma:asset/6ee6e9716cea49265cf2002d25a60b45f5d06fb7.png';
import { type AuthSession } from '../store/authStore';
import type { YandexAuthResponse } from '../types/yandex';
import { YANDEX_CLIENT_ID, getYandexRedirectUri } from '../config/yandexAuth';
import { getCurrentUser, loginWithYandex } from '../api/userService';
import { useI18n } from '../i18n/useI18n';

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}

const YANDEX_ICON =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Yandex_icon.svg/2048px-Yandex_icon.svg.png';

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [showManualFlow, setShowManualFlow] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;

    const waitForSdk = () => {
      if (cancelled) {
        return;
      }

      if (typeof window === 'undefined' || typeof window.YaAuthSuggest === 'undefined') {
        console.warn('[YandexAuth] sdk-suggest пока не доступен. Ждём...');
        setTimeout(waitForSdk, 200);
        return;
      }

      console.log('[YandexAuth] sdk-suggest готов.');
      setIsSdkReady(true);
    };

    waitForSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  const authenticateWithServer = useCallback(async (token: string) => {
    await loginWithYandex(token);
    try {
      return await getCurrentUser(token);
    } catch {
      return null;
    }
  }, []);

  const handleLoginClick = useCallback(() => {
    const hasSdk =
      typeof window !== 'undefined' &&
      typeof window.YaAuthSuggest === 'object' &&
      typeof window.YaAuthSuggest?.init === 'function';
    console.log('[YandexAuth] onClick', {
      isSdkReady,
      hasSdk,
      yaAuthSuggestType: typeof window.YaAuthSuggest,
      hasInit: typeof window.YaAuthSuggest?.init,
    });
    if (!hasSdk) {
      console.warn('[YandexAuth] YaAuthSuggest не найден в window, прерываемся');
      setError(t('Скрипт Яндекса ещё загружается. Попробуйте через пару секунд.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const redirectUri = getYandexRedirectUri();
    const widgetOrigin = new URL(redirectUri).origin;

    console.log('[YandexAuth] вызываем YaAuthSuggest.init', {
      redirectUri,
      widgetOrigin,
    });

    window
      .YaAuthSuggest!.init(
        {
          client_id: YANDEX_CLIENT_ID,
          response_type: 'token',
          redirect_uri: redirectUri,
        },
        widgetOrigin,
      )
      .then(({ handler }) => {
        console.log('[YandexAuth] init вернул handler, запускаем...');
        return handler();
      })
      .then(async (suggestData: YandexAuthResponse) => {
        console.log('Сообщение с токеном', suggestData);
        const token = suggestData.access_token ?? suggestData.token;

        if (!token) {
          throw new Error('Пустой токен авторизации');
        }

        const user = await authenticateWithServer(token);

        const session: AuthSession = {
          token,
          expiresIn: suggestData.expires_in,
          user: user ?? undefined,
          rawPayload: suggestData,
        };

        onLogin(session);
      })
      .catch((sdkError: unknown) => {
        console.error('[YandexAuth] ошибка', sdkError);
        const isUnavailable =
          typeof sdkError === 'object' &&
          sdkError !== null &&
          'code' in sdkError &&
          (sdkError as { code?: string }).code === 'not_available';

        if (isUnavailable) {
          setShowManualFlow(true);
          setError(
            t('Яндекс не выдаёт токен для локального домена. Используйте временный токен, полученный вручную.'),
          );
        } else {
          setError(t('Не удалось выполнить вход. Попробуйте снова или обратитесь в поддержку.'));
        }
      })
      .finally(() => setIsSubmitting(false));
  }, [authenticateWithServer, isSdkReady, onLogin]);

  const manualAuthUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}`;

  const handleManualLogin = () => {
    if (!manualToken.trim()) {
      setError(t('Скопируйте access_token из адресной строки и вставьте его в поле.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    authenticateWithServer(manualToken.trim())
      .then((user) => {
        onLogin({
          token: manualToken.trim(),
          user: user ?? undefined,
        });
      })
      .catch((authError: unknown) => {
        const message = authError instanceof Error ? authError.message : t('Не удалось выполнить вход.');
        setError(message);
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full px-8">
        <div className="text-center mb-12">
          <img src={logo} alt="ITMO" className="w-24 h-24 mx-auto mb-6" />
          <h1 className="mb-3">{t('Добро пожаловать')}</h1>
          <p className="text-gray-600">{t('Платформа поиска и размещения услуг для студентов, выпускников и сотрудников ИТМО')}</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h3 className="mb-6 text-center">{t('Вход в систему')}</h3>

          <button
            onClick={handleLoginClick}
            disabled={!isSdkReady || isSubmitting}
            className="w-full bg-white border-2 border-gray-900 text-gray-900 py-4 px-6 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between relative disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0">
              <img src={YANDEX_ICON} alt="Яндекс ID" className="w-8 h-8" />
            </div>
            <span className="absolute left-1/2 -translate-x-1/2">
              {isSubmitting ? t('Входим...') : t('Войти через Яндекс')}
            </span>
          </button>
          {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}

          {showManualFlow && (
            <div className="mt-8 border border-dashed border-gray-300 rounded-2xl p-5 bg-gray-50 space-y-4">
              <p className="text-sm text-gray-700">
                {t('Для локальной разработки Яндекс OAuth позволяет получить временный токен вручную.')}
                {` ${t('Нажмите кнопку ниже, авторизуйтесь и скопируйте значение')}`}{' '}
                <code className="px-1 py-0.5 mx-1 rounded bg-white text-xs">access_token</code>
                {` ${t('из адресной строки.')}`}
              </p>

              <button
                type="button"
                onClick={() => window.open(manualAuthUrl, '_blank', 'noopener,noreferrer')}
                className="w-full border border-gray-900 text-gray-900 py-3 rounded-xl text-sm font-semibold hover:bg-white"
              >
                {t('Открыть страницу авторизации')}
              </button>

              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 block mb-2">
                  {t('Вставьте access_token')}
                </label>
                <textarea
                  value={manualToken}
                  onChange={(event) => setManualToken(event.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none bg-white"
                  placeholder="ya29.a0ARrdaM..."
                />
              </div>

              <button
                type="button"
                onClick={handleManualLogin}
                className="w-full bg-primary text-white rounded-xl py-3 hover:bg-primary-light transition-colors text-sm font-semibold"
              >
                {t('Войти по токену')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
