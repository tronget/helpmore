import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Send, X } from 'lucide-react';
import {
  getChatsWhereUserIsOwner,
  getChatsWhereUserIsSender,
  getMessages,
  makeCommWebSocket,
  sendMessage,
  type ChatSummary,
  type MessageDto,
} from '../api/communicationService';
import {
  createFeedback,
  deleteResponse,
  getService,
  type ServiceDto,
} from '../api/marketplaceService';
import { useAuthStore } from '../store/authStore';
import { useUsersById } from '../hooks/useUsersById';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { useI18n } from '../i18n/useI18n';

interface ChatPageProps {
  selectedChatId: string | null;
}

type ChatTab = 'sent' | 'owned';

interface ChatItem extends ChatSummary {
  counterpartId: number;
}

export function ChatPage({ selectedChatId }: ChatPageProps) {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { t, dateLocale } = useI18n();
  const [tab, setTab] = useState<ChatTab>('sent');
  const [sentChats, setSentChats] = useState<ChatItem[]>([]);
  const [ownedChats, setOwnedChats] = useState<ChatItem[]>([]);
  const [servicesById, setServicesById] = useState<Record<number, ServiceDto>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<'success' | 'failed' | ''>('');
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const currentResponseIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        const [sentRaw, ownedRaw] = await Promise.all([
          getChatsWhereUserIsSender(token ?? ''),
          getChatsWhereUserIsOwner(token ?? ''),
        ]);

        const sent = Array.isArray(sentRaw) ? sentRaw : [];
        const owned = Array.isArray(ownedRaw) ? ownedRaw : [];
        if (!Array.isArray(sentRaw) || !Array.isArray(ownedRaw)) {
          console.warn('Unexpected chats payload', { sentRaw, ownedRaw });
        }

        const serviceIds = Array.from(
          new Set([...sent, ...owned].map((item) => item.service_id)),
        );
        const serviceMap: Record<number, ServiceDto> = {};
        await Promise.all(
          serviceIds.map(async (id) => {
            const data = await getService(id);
            serviceMap[id] = data;
          }),
        );

        if (!active) {
          return;
        }

        const toChatItem = (item: ChatSummary, isOwner: boolean): ChatItem => ({
          ...item,
          counterpartId: isOwner ? item.sender_id : item.owner_id,
        });

        setSentChats(sent.map((item) => toChatItem(item, false)));
        setOwnedChats(owned.map((item) => toChatItem(item, true)));
        setServicesById(serviceMap);
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
  }, [user?.id, token]);

  // WebSocket for live updates
  useEffect(() => {
    if (!token) {
      return;
    }
    const socket = makeCommWebSocket(token);
    setWs(socket);

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.type === 'new_message' && parsed.payload) {
          const msg = parsed.payload as MessageDto;
          if (msg.response_id !== currentResponseIdRef.current) {
            return;
          }
          setMessages((prev) => {
            if (prev.some((item) => item.id === msg.id)) {
              return prev;
            }
            return [...prev, msg];
          });
        }
      } catch (err) {
        console.error('ws message parse error', err);
      }
    };

    return () => {
      socket.close();
      setWs(null);
    };
  }, [token]);

  const chats = useMemo<ChatItem[]>(() => {
    const data = tab === 'sent' ? sentChats : ownedChats;
    return data
      .map((item) => ({
        ...item,
        service_title: servicesById[item.service_id]?.title ?? item.service_title,
      }))
      .sort((a, b) => {
        const timeA = a.last_message_at || a.response_created_at;
        const timeB = b.last_message_at || b.response_created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
  }, [tab, sentChats, ownedChats, servicesById]);

  const counterpartIds = useMemo(() => chats.map((item) => item.counterpartId), [chats]);
  const { users: usersById } = useUsersById(counterpartIds, token);

  const selectedId = selectedChatId ? Number(selectedChatId) : chats[0]?.response_id ?? null;
  const currentChat = chats.find((item) => item.response_id === selectedId) ?? null;
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
        await createFeedback(currentChat.service_id, {
          senderId: user.id,
          rate: rating,
          review: review.trim() ? review.trim() : null,
        });
      }

      await deleteResponse(currentChat.service_id, currentChat.response_id, user.id);
      if (tab === 'sent') {
        setSentChats((prev) => prev.filter((item) => item.response_id !== currentChat.response_id));
      } else {
        setOwnedChats((prev) => prev.filter((item) => item.response_id !== currentChat.response_id));
      }
      setShowCompleteModal(false);
      resetCompletion();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось завершить сделку.');
      setError(message);
    } finally {
      setIsCompleting(false);
    }
  };

  // Load messages when chat changes
  useEffect(() => {
    if (!currentChat) {
      setMessages([]);
      currentResponseIdRef.current = null;
      return;
    }

    currentResponseIdRef.current = currentChat.response_id;
    let active = true;
    setIsMessagesLoading(true);

    const loadMessages = async () => {
      try {
        const data = await getMessages(token ?? '', currentChat.response_id, { limit: 200 });
        if (!active) return;
        setMessages(data);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : t('Не удалось загрузить сообщения.');
        setError(message);
      } finally {
        if (active) setIsMessagesLoading(false);
      }
    };

    loadMessages();
    return () => {
      active = false;
    };
  }, [currentChat?.response_id]);

  const handleSendMessage = async () => {
    if (!currentChat || !messageText.trim()) {
      return;
    }
    const text = messageText.trim();
    setMessageText('');
    try {
      const msg = await sendMessage(token ?? '', currentChat.response_id, { text });
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось отправить сообщение.');
      setError(message);
    }
  };

  return (
    <div className="pt-[72px] h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3>{t('Чаты')}</h3>
            <div className="flex mt-3 gap-2">
              <button
                onClick={() => setTab('sent')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                  tab === 'sent'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-gray-200'
                }`}
              >
                {t('Мои отклики')}
              </button>
              <button
                onClick={() => setTab('owned')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                  tab === 'owned'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-gray-200'
                }`}
              >
                {t('Отклики на мои')}
              </button>
            </div>
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
              const tsRaw = chat.last_message_at || chat.response_created_at;
              const tsDate = tsRaw ? new Date(tsRaw) : null;
              const time = tsDate && !Number.isNaN(tsDate.getTime())
                ? tsDate.toLocaleDateString(dateLocale)
                : '';

              return (
                <button
                  key={chat.response_id}
                  onClick={() => navigate(`/chat/${chat.response_id}`)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedId === chat.response_id ? 'bg-primary-lighter' : ''
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
                    <p className="text-sm text-gray-500 truncate">
                      {servicesById[chat.service_id]?.title ?? chat.service_title}
                    </p>
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
                    <p className="text-sm text-gray-600">
                      {servicesById[currentChat.service_id]?.title ?? currentChat.service_title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                >
                  {t('Завершить сделку')}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
                {isMessagesLoading && <p className="text-gray-500">{t('Загрузка...')}</p>}
                {!isMessagesLoading && messages.length === 0 && (
                  <p className="text-gray-500">{t('Сообщений пока нет.')}</p>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  const text = msg.text || msg.text === '' ? msg.text : undefined;
                  return (
                    <div
                      key={msg.id}
                      className={`inline-flex flex-col px-4 py-3 rounded-2xl shadow-sm text-left ${
                        isMine
                          ? 'bg-primary text-white self-end items-end'
                          : 'bg-white border border-gray-200 self-start items-start'
                      }`}
                      style={{
                        maxWidth: '65%',
                        color: isMine ? '#fff' : undefined,
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {text ? (
                        <p
                          className={`whitespace-pre-wrap break-words ${
                            isMine ? '' : 'text-gray-900'
                          }`}
                          style={isMine ? { color: '#fff' } : undefined}
                        >
                          {text}
                        </p>
                      ) : null}
                      {msg.image_base64 ? (
                        <img
                          src={`data:image/png;base64,${msg.image_base64}`}
                          alt="attachment"
                          className="mt-2 rounded-lg max-h-64 object-contain"
                        />
                      ) : null}
                      <p
                        className={`text-xs mt-2 ${isMine ? '' : 'text-gray-500'}`}
                        style={isMine ? { color: 'rgba(255,255,255,0.8)' } : undefined}
                      >
                        {new Date(msg.created_at).toLocaleString(dateLocale)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={t('Напишите сообщение...')}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary-light disabled:opacity-60 flex items-center gap-2"
                    disabled={!messageText.trim()}
                  >
                    <Send className="w-4 h-4" />
                    {t('Отправить')}
                  </button>
                </div>
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
