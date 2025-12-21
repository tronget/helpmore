package org.moysha.managementservice.repository;

import java.util.Optional;
import org.moysha.managementservice.domain.feedback.FeedbackEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackRepository extends JpaRepository<FeedbackEntity, Long> {

    boolean existsBySender_IdAndService_Id(Long senderId, Long serviceId);

    Page<FeedbackEntity> findByService_Id(Long serviceId, Pageable pageable);

    Optional<FeedbackEntity> findByIdAndSender_Id(Long id, Long senderId);
}
