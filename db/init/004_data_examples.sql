BEGIN;

-- ===== Пользователи =====
WITH users AS (
  INSERT INTO app_user (token, email, role)
  VALUES
    ('token_user1', 'user1@example.com', 'user'),
    ('token_user2', 'user2@example.com', 'user'),
    ('token_user3', 'user3@example.com', 'user'),
    ('token_admin', 'admin@example.com', 'admin')
  RETURNING id, email
),

-- ===== Информация о пользователях =====
user_infos AS (
  INSERT INTO user_info (user_id, name, surname, faculty, telegram)
  SELECT
    id,
    CASE email
      WHEN 'user1@example.com' THEN 'Иван'
      WHEN 'user2@example.com' THEN 'Пётр'
      WHEN 'user3@example.com' THEN 'Сергей'
      ELSE 'Админ'
    END,
    CASE email
      WHEN 'user1@example.com' THEN 'Иванов'
      WHEN 'user2@example.com' THEN 'Петров'
      WHEN 'user3@example.com' THEN 'Сергеев'
      ELSE 'Системный'
    END,
    'ИТМО',
    CASE email
      WHEN 'user1@example.com' THEN '@ivan_itmo'
      WHEN 'user2@example.com' THEN '@petr_itmo'
      WHEN 'user3@example.com' THEN '@serg_itmo'
      ELSE '@admin_itmo'
    END
  FROM users
  RETURNING user_id
),

-- ===== Категории =====
categories AS (
  INSERT INTO category (name)
  VALUES
    ('Программирование'),
    ('Репетиторство'),
    ('Дизайн'),
    ('Ремонт'),
    ('Mock-собеседование'),
    ('Карьера'),
    ('Другое')
  RETURNING id, name
),

-- ===== Услуги =====
services AS (
  INSERT INTO service (owner_id, category_id, title, description, type, price)
  SELECT
    u.id,
    c.id,
    s.title,
    s.description,
    s.type::service_type,
    s.price
  FROM (
    VALUES
      ('user1@example.com','Программирование','Помощь с курсовыми по Java',
       'Вместе разберемся с Spring Data, Spring Boot, SQL и другими технологиями.',
       'offer',1500.00),
      ('user1@example.com','Репетиторство','Репетитор по информатике',
       'Подготовка к ЕГЭ, ОГЭ, олимпиадам.',
       'offer',1000.00),
      ('user2@example.com','Дизайн','Логотипы на заказ',
       'Делаю простые и стильные логотипы.',
       'offer',1200.00),
      ('user2@example.com','Программирование','Помощь с курсовой по Python',
       'Нужен студент, который поможет разобраться с pandas и matplotlib.',
       'order',1300.00),
      ('user3@example.com','Ремонт','Ремонт ноутбука',
       'Перестал включаться ноутбук, требуется диагностика и ремонт.',
       'order',1000.00),
      ('user3@example.com','Программирование','Настройка Docker проекта',
       'Проект на Spring + React, нужна помощь с docker-compose.',
       'order',1337.00)
  ) AS s(owner_email, category_name, title, description, type, price)
  JOIN users u ON u.email = s.owner_email
  JOIN categories c ON c.name = s.category_name
  RETURNING id, owner_id
),

-- ===== Отклики =====
responses AS (
  INSERT INTO response (sender_id, service_id)
  SELECT
    u.id,
    s.id
  FROM (
    VALUES
      ('user2@example.com', 'Помощь с курсовыми по Java'),
      ('user3@example.com', 'Помощь с курсовыми по Java')
  ) r(sender_email, service_title)
  JOIN users u ON u.email = r.sender_email
  JOIN service s ON s.title = r.service_title
  RETURNING id, sender_id, service_id
),

-- ===== Сообщения =====
messages AS (
  INSERT INTO message (response_id, sender_id, receiver_id, message_text)
  SELECT
    r.id,
    sender.id,
    receiver.id,
    m.text
  FROM (
    VALUES
      (1,'user2@example.com','user1@example.com','Здравствуйте! Хотел бы обсудить детали.'),
      (1,'user1@example.com','user2@example.com','Конечно, задавайте вопросы.'),
      (2,'user3@example.com','user1@example.com','Здравствуйте, вы делаете проекты по базам данных?')
  ) m(resp_num, sender_email, receiver_email, text)
  JOIN responses r ON r.id = m.resp_num
  JOIN users sender ON sender.email = m.sender_email
  JOIN users receiver ON receiver.email = m.receiver_email
),

-- ===== Отзывы =====
feedbacks AS (
  INSERT INTO feedback (sender_id, service_id, review, rate)
  SELECT
    u.id,
    s.id,
    f.review,
    f.rate
  FROM (
    VALUES
      ('user2@example.com','Помощь с курсовыми по Java',
       'Отличная работа, всё вовремя и качественно!',5),
      ('user3@example.com','Помощь с курсовыми по Java',
       'Хорошо, но были задержки.',4)
  ) f(sender_email, service_title, review, rate)
  JOIN users u ON u.email = f.sender_email
  JOIN service s ON s.title = f.service_title
),

-- ===== Избранное =====
favourites AS (
  INSERT INTO favourite_service (user_id, service_id)
  SELECT u.id, s.id
  FROM (
    VALUES
      ('user2@example.com','Помощь с курсовыми по Java'),
      ('user3@example.com','Помощь с курсовыми по Java'),
      ('user3@example.com','Логотипы на заказ')
  ) f(email, title)
  JOIN users u ON u.email = f.email
  JOIN service s ON s.title = f.title
),

-- ===== Репорты =====
reports AS (
  INSERT INTO report (user_id, reported_user_id, title, description, type)
  SELECT
    u1.id,
    u2.id,
    r.title,
    r.description,
    r.type::report_type
  FROM (
    VALUES
      ('user2@example.com','user3@example.com','Спам',
       'Пользователь пишет в личные сообщения без причины','spam'),
      ('user3@example.com','user2@example.com','Оскорбление',
       'В отзыве использованы грубые слова','insult')
  ) r(user_email, reported_email, title, description, type)
  JOIN users u1 ON u1.email = r.user_email
  JOIN users u2 ON u2.email = r.reported_email
)

-- ===== Баг-репорт =====
INSERT INTO bug_report (user_id, title, description)
SELECT
  u.id,
  'Ошибка загрузки аватара',
  'Не загружается файл размером более 2 МБ'
FROM users u
WHERE u.email = 'user1@example.com';

COMMIT;
