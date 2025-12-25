CREATE EXTENSION IF NOT EXISTS citext;

BEGIN;

-- ===== Справочные ENUM'ы =====
DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('user','moderator','admin');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
            CREATE TYPE service_status AS ENUM ('active','archived');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
            CREATE TYPE service_type AS ENUM ('offer','order');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_type') THEN
            CREATE TYPE report_type AS ENUM ('spam','fraud','insult','illegal','other');
        END IF;
    END$$;



-- ===== Пользователь =====
CREATE TABLE IF NOT EXISTS app_user (
                                        id            SERIAL PRIMARY KEY,
                                        token         VARCHAR(1024) NOT NULL UNIQUE,
                                        email         CITEXT NOT NULL UNIQUE,
                                        role          user_role NOT NULL DEFAULT 'user',
                                        banned_till   TIMESTAMPTZ,
                                        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_info (
                                         id      SERIAL PRIMARY KEY,
                                         user_id       INT REFERENCES app_user(id) ON DELETE CASCADE,
                                         name          VARCHAR(120) NOT NULL,
                                         surname       VARCHAR(120) NOT NULL,
                                         middle_name   VARCHAR(120),
                                         avatar        BYTEA,
                                         faculty       VARCHAR(160),
                                         phone_number  VARCHAR(32),
                                         telegram      VARCHAR(64) UNIQUE,
                                         rate          NUMERIC(3,2) NOT NULL DEFAULT 0.00,
                                         CONSTRAINT chk_phone_fmt CHECK (phone_number IS NULL OR phone_number ~
                                                                                                 '^[0-9+()\-\\s]{5,32}$'),
                                         CONSTRAINT chk_rate_bounds CHECK (rate >= 0 AND rate <= 5)
);

-- ===== Категории =====
CREATE TABLE IF NOT EXISTS category (
                                        id     SERIAL PRIMARY KEY,
                                        name   VARCHAR(255) NOT NULL UNIQUE
);

-- ===== Услуги =====
CREATE TABLE IF NOT EXISTS service (
                                       id            SERIAL PRIMARY KEY,
                                       owner_id      INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                       category_id   INT NOT NULL REFERENCES category(id),
                                       title         VARCHAR(255) NOT NULL,
                                       description   VARCHAR(5000) NOT NULL,
                                       status        service_status NOT NULL DEFAULT 'active',
                                       type          service_type   NOT NULL,
                                       price         NUMERIC(10,2)  NOT NULL DEFAULT 0.00,
                                       barter        BOOLEAN        NOT NULL DEFAULT FALSE,
                                       place         VARCHAR(255),
                                       created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                                       CONSTRAINT chk_price_nonneg CHECK (price >= 0),
                                       CONSTRAINT unq_service_title_per_owner UNIQUE (owner_id, title)
);



-- ===== Избранное =====
CREATE TABLE IF NOT EXISTS favourite_service (
                                                 user_id    INT  NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                                 service_id INT  NOT NULL REFERENCES service(id)  ON DELETE CASCADE,
                                                 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                                 PRIMARY KEY (user_id, service_id)
);

-- ===== Отклики =====
CREATE TABLE IF NOT EXISTS response (
                                        id            SERIAL PRIMARY KEY,
                                        sender_id     INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                        service_id    INT NOT NULL REFERENCES service(id)  ON DELETE CASCADE,
                                        status        service_status NOT NULL DEFAULT 'active',
                                        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                                        CONSTRAINT unq_response UNIQUE (sender_id, service_id)
);

-- ===== Сообщения по отклику (чат 1-на-1) =====
CREATE TABLE IF NOT EXISTS message (
                                       id            SERIAL PRIMARY KEY,
                                       response_id   INT  NOT NULL REFERENCES response(id) ON DELETE CASCADE,
                                       sender_id     INT  NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                       receiver_id   INT  NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                       message_text  VARCHAR(5000),
                                       message_image BYTEA,
                                       created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                                       CONSTRAINT message_not_empty CHECK (
                                           message_text IS NOT NULL OR message_image IS NOT NULL
                                           ),
                                       CONSTRAINT sender_not_receiver CHECK (
                                           sender_id <> receiver_id
                                           )
);

-- ===== Отзывы =====
CREATE TABLE IF NOT EXISTS feedback (
                                        id            SERIAL PRIMARY KEY,
                                        sender_id     INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                        service_id    INT NOT NULL REFERENCES service(id)  ON DELETE CASCADE,
                                        review        VARCHAR(5000),
                                        rate          SMALLINT NOT NULL,
                                        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                                        CONSTRAINT chk_rate_range CHECK (rate BETWEEN 1 AND 5),
                                        CONSTRAINT unq_feedback_one_per_user UNIQUE (sender_id, service_id)
);



-- ===== Репорты и баг-репорты =====
CREATE TABLE IF NOT EXISTS report (
                                      id             SERIAL PRIMARY KEY,
                                      user_id    INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                      reported_user_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                      title          VARCHAR(255) NOT NULL,
                                      description    VARCHAR(1000) NOT NULL,
                                      type           report_type NOT NULL,
                                      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
                                      CONSTRAINT chk_report_not_self CHECK (user_id <> reported_user_id)
);

CREATE TABLE IF NOT EXISTS bug_report (
                                          id          SERIAL PRIMARY KEY,
                                          user_id     BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                          title       VARCHAR(255) NOT NULL,
                                          description VARCHAR(5000) NOT NULL,
                                          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
