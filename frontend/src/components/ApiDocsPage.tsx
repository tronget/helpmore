import { useMemo, useState } from 'react';
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import userManagementDoc from '../../apiDocs/API.md?raw';
import marketplaceDoc from '../../apiDocs/API_DOC.md?raw';
import { useI18n } from '../i18n/useI18n';

type DocId = 'user' | 'marketplace';

interface DocMeta {
  id: DocId;
  title: string;
  description: string;
  content: string;
  summaryItems: string[];
}

const markdownComponents = {
  h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-3xl font-semibold mt-12 mb-6 first:mt-0 text-gray-900" {...props} />
  ),
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900" {...props} />
  ),
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl font-semibold mt-8 mb-3 text-gray-900" {...props} />
  ),
  p: (props: HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-gray-700 leading-relaxed mb-4" {...props} />
  ),
  ul: (props: HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700" {...props} />
  ),
  ol: (props: HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-700" {...props} />
  ),
  li: (props: HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props} />
  ),
  code: ({
    inline,
    className,
    children,
    ...props
  }: HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
    if (inline) {
      return (
        <code className="px-1 py-0.5 rounded bg-gray-100 text-gray-900 text-sm" {...props}>
          {children}
        </code>
      );
    }

    return (
      <pre className="bg-gray-900 text-gray-100 text-sm rounded-xl p-4 overflow-x-auto mb-6">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  table: (props: TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full border border-gray-200 rounded-xl text-sm" {...props} />
    </div>
  ),
  thead: (props: HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-gray-50" {...props} />
  ),
  th: (props: ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="text-left px-4 py-2 font-semibold text-gray-900 border-b border-gray-200" {...props} />
  ),
  td: (props: TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-2 text-gray-700 border-b border-gray-100 align-top" {...props} />
  ),
};

export function ApiDocsPage() {
  const [activeDoc, setActiveDoc] = useState<DocId>('user');
  const { t } = useI18n();

  const docs = useMemo<DocMeta[]>(
    () => [
      {
        id: 'user',
        title: t('Управление пользователями'),
        description: t('Аутентификация, профили пользователей и модерация ролей/банов.'),
        content: userManagementDoc,
        summaryItems: [
          t('OAuth-авторизация через Yandex'),
          t('CRUD и модерация пользователей'),
          t('Оценки и баны'),
        ],
      },
      {
        id: 'marketplace',
        title: t('Управление витриной'),
        description: t('Категории, сервисы, отзывы, избранное и прочие сущности витрины.'),
        content: marketplaceDoc,
        summaryItems: [
          t('Категории и объявления (Service/Order)'),
          t('Отклики и отзывы'),
          t('Избранное и пагинация'),
        ],
      },
    ],
    [t],
  );

  const currentDoc = useMemo(
    () => docs.find((doc) => doc.id === activeDoc) ?? docs[0],
    [activeDoc],
  );

  return (
    <div className="bg-neutral-50 min-h-screen pt-[72px] pb-16">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="py-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
            {t('API документация')}
          </p>
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            {t('Интеграция фронтенда с бэкендом')}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            {t('Здесь собраны актуальные описания REST-эндпоинтов всех микросервисов.')}
            {` ${t('Используйте вкладки, чтобы быстро переключаться между разделами и уточнять требования к запросам, схемы данных и возможные ошибки.')}`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    doc.id === currentDoc.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <p className="text-sm font-semibold tracking-wide uppercase">
                    {doc.title}
                  </p>
                  <p
                    className={`mt-2 text-sm ${
                      doc.id === currentDoc.id ? 'text-white/80' : 'text-gray-600'
                    }`}
                  >
                    {doc.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-br from-primary/10 via-white to-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('Как использовать')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t(
                  'Для вызовов используйте `fetch`/`axios` из фронтенда, передавая указанные заголовки авторизации и структуры тел запроса. При разработке рекомендуется обращать внимание на возвращаемые коды ошибок и текстовые сообщения.',
                )}
              </p>
            </div>
          </aside>

          <section className="flex-1">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm">
              <div className="p-8 border-b border-gray-100">
                <p className="text-sm uppercase font-semibold tracking-wide text-primary mb-2">
                  {currentDoc.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900 mb-4">
                  {currentDoc.description}
                </p>
                <ul className="flex flex-wrap gap-3">
                  {currentDoc.summaryItems.map((item) => (
                    <li
                      key={item}
                      className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                  className="space-y-4"
                >
                  {currentDoc.content}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
