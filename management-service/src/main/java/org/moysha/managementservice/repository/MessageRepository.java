package org.moysha.managementservice.repository;

import org.moysha.managementservice.domain.message.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {
}
