package org.moysha.managementservice.repository;

import org.moysha.managementservice.domain.response.ResponseEntity;
import org.moysha.managementservice.domain.response.ResponseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResponseRepository extends JpaRepository<ResponseEntity, Long> {

    boolean existsBySender_IdAndService_Id(Long senderId, Long serviceId);

    Page<ResponseEntity> findByService_Id(Long serviceId, Pageable pageable);

    Page<ResponseEntity> findBySender_IdOrService_Owner_Id(Long senderId, Long ownerId, Pageable pageable);

    java.util.Optional<ResponseEntity> findBySender_IdAndService_Id(Long senderId, Long serviceId);

    Page<ResponseEntity> findByService_IdAndStatus(Long serviceId, ResponseStatus status, Pageable pageable);

    @Query("""
        select r from ResponseEntity r
        where r.status = :status
          and (r.sender.id = :userId or r.service.owner.id = :userId)
        """)
    Page<ResponseEntity> findByUserAndStatus(@Param("userId") Long userId,
                                             @Param("status") ResponseStatus status,
                                             Pageable pageable);
}
