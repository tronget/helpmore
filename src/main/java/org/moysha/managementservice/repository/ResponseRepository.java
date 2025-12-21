package org.moysha.managementservice.repository;

import org.moysha.managementservice.domain.response.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResponseRepository extends JpaRepository<ResponseEntity, Long> {

    boolean existsBySender_IdAndService_Id(Long senderId, Long serviceId);

    Page<ResponseEntity> findByService_Id(Long serviceId, Pageable pageable);

    Page<ResponseEntity> findBySender_IdOrService_Owner_Id(Long senderId, Long ownerId, Pageable pageable);
}
