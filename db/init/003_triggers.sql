BEGIN;
-- запрет действий забаненных пользователей — вспомогательная функция
CREATE OR REPLACE FUNCTION assert_not_banned(p_user_id BIGINT)
    RETURNS VOID
    LANGUAGE plpgsql
AS $$
DECLARE v_until TIMESTAMPTZ;
BEGIN
    SELECT banned_till INTO v_until FROM app_user WHERE id = p_user_id;
    IF v_until IS NOT NULL AND v_until > now() THEN
        RAISE EXCEPTION 'user % is banned until %', p_user_id, v_until
            USING ERRCODE = 'check_violation';
    END IF;
END$$;

-- триггер: запрет публикации услуги для забаненных
CREATE OR REPLACE FUNCTION trg_service_assert_not_banned()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM assert_not_banned(NEW.owner_id);
    RETURN NEW;
END$$;

CREATE OR REPLACE TRIGGER t_service_not_banned
    BEFORE INSERT OR UPDATE ON service
    FOR EACH ROW EXECUTE FUNCTION trg_service_assert_not_banned();

-- запрет отклика на свой сервис
CREATE OR REPLACE FUNCTION trg_response_no_self()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_owner INT;
BEGIN
    SELECT owner_id INTO v_owner FROM service WHERE id = NEW.service_id;
    IF v_owner = NEW.sender_id THEN
        RAISE EXCEPTION 'owner cannot respond to own service' USING
            ERRCODE='check_violation';
    END IF;
    PERFORM assert_not_banned(NEW.sender_id);
    RETURN NEW;
END$$;

CREATE OR REPLACE TRIGGER t_response_no_self
    BEFORE INSERT ON response
    FOR EACH ROW EXECUTE FUNCTION trg_response_no_self();



-- запрет отзыва на свой сервис
CREATE OR REPLACE FUNCTION trg_feedback_no_self()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_owner INT;
BEGIN
    SELECT owner_id INTO v_owner FROM service WHERE id = NEW.service_id;
    IF v_owner = NEW.sender_id THEN
        RAISE EXCEPTION 'owner cannot leave feedback to own service' USING
            ERRCODE='check_violation';
    END IF;
    PERFORM assert_not_banned(NEW.sender_id);
    RETURN NEW;
END$$;

CREATE OR REPLACE TRIGGER t_feedback_no_self
    BEFORE INSERT ON feedback
    FOR EACH ROW EXECUTE FUNCTION trg_feedback_no_self();


-- поддержка агрегированного рейтинга исполнителя (owner) в user_info.rate
CREATE OR REPLACE FUNCTION recalc_owner_rate(p_owner_id INT)
    RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE user_info ui
    SET rate = COALESCE((
                            SELECT ROUND(AVG(f.rate)::numeric, 2)
                            FROM feedback f
                                     JOIN service s ON s.id = f.service_id
                            WHERE s.owner_id = p_owner_id
                        ), 0)
    WHERE ui.user_id = p_owner_id;
END$$;

CREATE OR REPLACE FUNCTION trg_feedback_recalc_rate()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_owner INT;
BEGIN
    SELECT owner_id INTO v_owner FROM service WHERE id =
                                                    COALESCE(NEW.service_id, OLD.service_id);
    PERFORM recalc_owner_rate(v_owner);
    RETURN COALESCE(NEW, OLD);
END$$;

CREATE OR REPLACE TRIGGER t_feedback_recalc_ins
    AFTER INSERT ON feedback
    FOR EACH ROW EXECUTE FUNCTION trg_feedback_recalc_rate();



CREATE OR REPLACE TRIGGER t_feedback_recalc_upd
    AFTER UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION trg_feedback_recalc_rate();

CREATE OR REPLACE TRIGGER t_feedback_recalc_del
    AFTER DELETE ON feedback
    FOR EACH ROW EXECUTE FUNCTION trg_feedback_recalc_rate();
COMMIT;