import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, MessageCircle, X } from 'lucide-react';
import {
  createFeedback,
  deleteResponse,
  getService,
  getUserResponses,
  type ResponseDto,
  type ServiceDto,
} from '../api/marketplaceService';
import { updateUserRate } from '../api/userService';
import { useAuthStore } from '../store/authStore';
import { useUsersById } from '../hooks/useUsersById';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { useI18n } from '../i18n/useI18n';

interface ChatPageProps {
  selectedChatId: string | null;
}

interface ChatItem {
  id: number;
  responseId: number;
  serviceId: number;
  serviceTitle: string;
  ownerId: number;
  senderId: number;
  counterpartId: number;
  createdAt: string;
}

export function ChatPage({ selectedChatId }: ChatPageProps) {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { t, dateLocale } = useI18n();
  const [responses, setResponses] = useState<ResponseDto[]>([]);
  const [servicesById, setServicesById] = useState<Record<number, ServiceDto>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<'success' | 'failed' | ''>('');
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        const responsePage = await getUserResponses(user.id);
        const responseList = responsePage.content;
        const serviceIds = Array.from(new Set(responseList.map((item) => item.serviceId)));
        const services = await Promise.all(serviceIds.map((id) => getService(id)));
        if (!active) {
          return;
        }
        const map = services.reduce<Record<number, ServiceDto>>((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});
        setServicesById(map);
        setResponses(responseList);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : t('Не удалось загрузить чаты.');
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const chats = useMemo<ChatItem[]>(() => {
    if (!user) {
      return [];
    }
    return responses
      .map((response) => {
        const service = servicesById[response.serviceId];
        if (!service) {
          return null;
        }
        const counterpartId = response.senderId === user.id ? service.ownerId : response.senderId;
        return {
          id: response.id,
          responseId: response.id,
          serviceId: response.serviceId,
          serviceTitle: service.title,
          ownerId: service.ownerId,
          senderId: response.senderId,
          counterpartId,
          createdAt: response.createdAt,
        };
      })
      .filter((item): item is ChatItem => item !== null);
  }, [responses, servicesById, user]);

  const counterpartIds = useMemo(() => chats.map((item) => item.counterpartId), [chats]);
  const { users: usersById } = useUsersById(counterpartIds, token);

  const selectedId = selectedChatId ? Number(selectedChatId) : chats[0]?.id ?? null;
  const currentChat = chats.find((item) => item.id === selectedId) ?? null;
  const counterpart = currentChat ? usersById[currentChat.counterpartId] : undefined;
  const counterpartName =
    [counterpart?.profile?.surname, counterpart?.profile?.name]
      .filter(Boolean)
      .join(' ')
      .trim() || counterpart?.email || t('Пользователь');
  const avatarSrc = counterpart?.profile?.avatar
    ? `data:image/png;base64,${counterpart.profile.avatar}`
    : null;

  const resetCompletion = () => {
    setCompletionStatus('');
    setRating(null);
    setReview('');
  };

  const handleCompleteDeal = async () => {
    if (!user || !currentChat) {
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      if (completionStatus === 'success' && rating) {
        await createFeedback(currentChat.serviceId, {
          senderId: user.id,
          rate: rating,
          review: review.trim() ? review.trim() : null,
        });
        await updateUserRate(token ?? '', {
          userId: currentChat.counterpartId,
          newMark: rating,
        });
      }

      await deleteResponse(currentChat.serviceId, currentChat.responseId, user.id);
      setResponses((prev) => prev.filter((item) => item.id !== currentChat.responseId));
      setShowCompleteModal(false);
      resetCompletion();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось завершить сделку.');
      setError(message);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="pt-[72px] h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3>{t('Чаты')}</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="p-4 text-gray-500">{t('Загрузка чатов...')}</p>}
            {error && <p className="p-4 text-red-500">{error}</p>}
            {!isLoading && !error && chats.length === 0 && (
              <p className="p-4 text-gray-500">{t('Чатов пока нет.')}</p>
            )}
            {chats.map((chat) => {
              const chatUser = usersById[chat.counterpartId];
              const chatName =
                [chatUser?.profile?.surname, chatUser?.profile?.name]
                  .filter(Boolean)
                  .join(' ')
                  .trim() || chatUser?.email || t('Пользователь');
              const chatAvatar = chatUser?.profile?.avatar
                ? `data:image/png;base64,${chatUser.profile.avatar}`
                : null;
              const time = new Date(chat.createdAt).toLocaleDateString(dateLocale);

              return (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedId === chat.id ? 'bg-primary-lighter' : ''
                  }`}
                >
                  {chatAvatar ? (
                    <img
                      src={chatAvatar}
                      alt={chatName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarPlaceholder className="w-12 h-12" iconClassName="w-5 h-5" />
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">{chatName}</span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{time}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{chat.serviceTitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gray-50">
          {currentChat ? (
            <>
              <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={counterpartName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarPlaceholder className="w-10 h-10" iconClassName="w-4 h-4" />
                  )}
                  <div>
                    <h4>{counterpartName}</h4>
                    <p className="text-sm text-gray-600">{currentChat.serviceTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                >
                  {t('Завершить сделку')}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 text-center text-gray-500">
                {t('Обмен сообщениями пока не реализован.')}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {t('Выберите чат слева.')}
            </div>
          )}
        </div>
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3>{t('Завершение сделки')}</h3>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  resetCompletion();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-700 mb-3">{t('Удалось выполнить заказ/услугу?')}</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="completion"
                      checked={completionStatus === 'success'}
                      onChange={() => setCompletionStatus('success')}
                    />
                    {t('Да, сделка выполнена')}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="completion"
                      checked={completionStatus === 'failed'}
                      onChange={() => setCompletionStatus('failed')}
                    />
                    {t('Нет, сделка сорвалась')}
                  </label>
                </div>
              </div>

              {completionStatus === 'success' && (
                <>
                  <div>
                    <p className="text-sm text-gray-700 mb-3">{t('Оцените второго участника')}</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => setRating(value)}
                          className={`w-10 h-10 rounded-full border text-sm ${
                            rating === value
                              ? 'border-primary bg-primary-lighter text-primary'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-700">{t('Отзыв')}</label>
                    <textarea
                      value={review}
                      onChange={(event) => setReview(event.target.value)}
                      rows={3}
                      maxLength={5000}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder={t('Опишите, как прошла сделка')}
                    />
                    <p className="text-xs text-gray-500 mt-1">{review.length}/5000</p>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    resetCompletion();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  {t('Отмена')}
                </button>
                <button
                  onClick={handleCompleteDeal}
                  disabled={
                    isCompleting ||
                    (completionStatus === 'success' && (rating === null || rating === 0)) ||
                    completionStatus === ''
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompleting ? t('Завершаем...') : t('Завершить')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
