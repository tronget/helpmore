export const categoryIcons: Record<string, string> = {
  'Помощь в учёбе': '📚',
  'Переезд': '🚚',
  'Документы': '📄',
  'Наука': '🔬',
  'Разное': '✨',
};

export const getCategoryIcon = (name: string) => categoryIcons[name] ?? '📌';
