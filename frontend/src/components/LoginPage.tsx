import { useCallback, useEffect, useRef, useState } from 'react';
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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAMAAABC4vDmAAAAb1BMVEXtHyT////sAAj0kZPsAADsFBb96+vtGyHtLCz3rK3tFx385ub5yMj6z9D1lJb+8vL0jI7uNTf+9/fyenvvR0r1mJnsDBDzgIL72tr84OHwWFrzhYbxXmDuOTzvPkHxaWvycHD2oKH5vL33s7TvTlB4d/0LAAADvUlEQVR4nO3c2XLjIBAFUETAWMiK5CV4TSwn+f9vHC8xjcCZolKZuf3AfZiHUcU6hWUEjYSormlm9fMTOM/1rLlpxOWfrp8rJeFRat53d1SrlBEsYpRqb6jWWjSGYm17QXWKkemsUt0Z1Su0YxzVV6KZM7me7jHzRsyYNdS5qWai5oeqxbNEI+LIZ/HED/VUUHkpqNwUVG4KKjcFlZuCyk1B5aagclNQuflFlLFSRdFYlHZOr5Yvp3qUw8+m3r+DkvJ42lRpJj9rqt9AObfeLB6QgCirltuHIiBKT9+/I8FQ8vPbZoKh5OHxxYREud3Y1DW3IFH6bUKgxXa/ml4jXoEoo1sybQelrLnGToEoeSJTbR1hgSi9oguqDkveSJRqA1N4AIjS1Bts5aiUC0S5mf/dHcbnxqHs3H95cXkZh1L001tFpwai/PhpE4/kYCi76+5nTv4ehnL77y5zIEp+3E/cyHhpB4aiS6pNVlFQKKP9b+/EBmXfPGqZ/DkKpQ8edUxOjEK5pUd9JhNOFEo9edQbH9SJUMliLwxVe9QrH9QHtRTHr2/FB9V71I5jlzC4+CAMdfSoF463mfRZC9zQxU9lWA5dFjs2w2FHvedLfKXDUHrwqA0blDFUwTtGKuAUi2408YAYOEOmTiGeZAFrCZKqwov56AsEouwnlacmr+HZofUp6hWqZhpcV0iUkMFyzKJX/iuEovSoYN0elXJaW2u1AKKEGkZl9O69Xw/H4/EwIFHCrZMFh8UlUFTcVnFAC0Zu1/BDCS1rfihh3KFlhzo3lhom7FBhnZ8PisbG1fKSNQNUMAmslXNOGjzKCN9Q3XUOD733fSWoVZ2uH8UAZYUv81fWMEEFnedXoRiPsm90+/0q6uFRiobq91IHHKV31FU6wwRlZ0lDwVFBnWriK7JglNE0mqKXp8Ao6Vf9qgWVqbAoM6V+s5fBfyNR6sWbwrfMoCgbPFeyZjNDphvMJPwM6AM4n9Rv7sOyC7TAQf1mI8IKMfJZF6p6Rku2SBQNzLfjoiew5rmmhlozQZkpVYc31kTHQKjwebwh+gDYgpGgfnOjo8UZBsu11ZLJikPwoFK1Sd7VB6GCfjNZBEGhXDAwb9PzQlDGBgWpdAkZg3JBv5k+PQVCBVO9Knn2DYWyK/8myvDwrHb/dXj5Hy9069/WSS+o26f+/fA/Qf3rFFRuCio3BZWbgspNQeWmoHJTULkpqNwUVG7OKJabYrHcPozlRmsst6RjuXkfz20OWW4IyXPrTJ6bjFbctmP9A65lOVk8xAdMAAAAAElFTkSuQmCC';

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const redirectUri = getYandexRedirectUri();
  const popupRef = useRef<Window | null>(null);

  const authenticateWithServer = useCallback(async (token: string) => {
    await loginWithYandex(token);
    try {
      return await getCurrentUser(token);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const redirectOrigin = new URL(redirectUri).origin;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin && event.origin !== redirectOrigin) {
        return;
      }

      const data = event.data as { type?: string; payload?: YandexAuthResponse };
      if (!data || data.type !== 'yandex_oauth_token' || !data.payload) {
        return;
      }

      const token = data.payload.access_token ?? data.payload.token;
      if (!token) {
        setError(t('Пустой токен авторизации'));
        return;
      }

      setIsSubmitting(true);
      setError(null);

      authenticateWithServer(token)
        .then((user) => {
          const session: AuthSession = {
            token,
            expiresIn: data.payload.expires_in,
            user: user ?? undefined,
            rawPayload: data.payload,
          };
          onLogin(session);
        })
        .catch((authError: unknown) => {
          const message = authError instanceof Error ? authError.message : t('Не удалось выполнить вход.');
          setError(message);
        })
        .finally(() => setIsSubmitting(false));
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authenticateWithServer, onLogin, redirectUri, t]);

  const buildOauthUrl = useCallback(() => {
    const authUrl = new URL('https://oauth.yandex.ru/authorize');
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('client_id', YANDEX_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    return authUrl.toString();
  }, [redirectUri]);

  const openPopupShell = useCallback(() => {
    const width = 480;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      '',
      'yandex-oauth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );

    if (!popup) {
      return false;
    }

    popupRef.current = popup;
    return true;
  }, [t]);

  const navigatePopupToAuth = useCallback(() => {
    if (!popupRef.current || popupRef.current.closed) {
      return false;
    }
    popupRef.current.location.href = buildOauthUrl();
    return true;
  }, [buildOauthUrl]);

  const handleLoginClick = useCallback(() => {
    setError(null);
    const popupOpened = openPopupShell();
    setIsSubmitting(true);

    const navigated = popupOpened && navigatePopupToAuth();
    if (!navigated) {
      setIsSubmitting(false);
    }
  }, [navigatePopupToAuth, openPopupShell]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-[72px]">
      <div className="max-w-md w-full px-8">
        <div className="text-center mb-12">
          <img src={logo} alt={t('Логотип HelpMore')} className="w-24 h-24 mx-auto mb-6" />
          <h1 className="mb-3">{t('Добро пожаловать')}</h1>
          <p className="text-gray-600">{t('Платформа поиска и размещения услуг для студентов, выпускников и сотрудников ИТМО')}</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h3 className="mb-6 text-center">{t('Вход в систему')}</h3>

          <button
            onClick={handleLoginClick}
            disabled={isSubmitting}
            className="w-full bg-white border-2 border-gray-900 text-gray-900 py-4 px-6 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between relative disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0">
              <img src={YANDEX_ICON} alt={t('Яндекс ID')} className="w-8 h-8" />
            </div>
            <span className="absolute left-1/2 -translate-x-1/2">
              {isSubmitting ? t('Входим...') : t('Войти через Яндекс')}
            </span>
          </button>
          {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}

        </div>
      </div>
    </div>
  );
}
