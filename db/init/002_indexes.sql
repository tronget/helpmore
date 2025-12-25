CREATE INDEX IF NOT EXISTS app_user_banned_active_idx
  ON app_user (banned_till)
  WHERE banned_till IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_user_token
  ON app_user (token);

CREATE INDEX IF NOT EXISTS service_pub_cat_type_created_idx
  ON service (category_id, type, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS service_pub_created_idx
  ON service (created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS service_owner_created_idx
  ON service (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_price
  ON service (price);


CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_service_title_trgm ON service USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_response_service_created_at
  ON response (service_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_response_sender_created_at
  ON response (sender_id, created_at  DESC);

CREATE INDEX IF NOT EXISTS idx_message_response_id
  ON message (response_id);

CREATE INDEX IF NOT EXISTS idx_message_receiver_created_at
  ON message (receiver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_message_sender_created_at
  ON message (sender_id, created_at);

CREATE INDEX IF NOT EXISTS message_pair_created_idx
  ON message (
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_feedback_service_created_at
  ON feedback (service_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_sender_created_at
  ON feedback (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS report_reported_created_idx
  ON report (reported_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS report_type_idx
  ON report (type);

CREATE INDEX IF NOT EXISTS bug_report_created_idx
  ON bug_report (created_at DESC);

CREATE INDEX IF NOT EXISTS bug_report_user_idx
  ON bug_report (user_id);