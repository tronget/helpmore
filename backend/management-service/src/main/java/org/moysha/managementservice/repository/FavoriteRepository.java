package org.moysha.managementservice.repository;

import org.moysha.managementservice.domain.favorite.FavoriteEntity;
import org.moysha.managementservice.domain.favorite.FavoriteKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoriteRepository extends JpaRepository<FavoriteEntity, FavoriteKey> {

    @Query("SELECT f FROM FavoriteEntity f WHERE f.user.id = :userId")
    Page<FavoriteEntity> findByUserId(@Param("userId") Long userId, Pageable pageable);

    default Page<FavoriteEntity> findByUser_Id(Long userId, Pageable pageable) {
        return findByUserId(userId, pageable);
    }

    boolean existsByUser_IdAndService_Id(Long userId, Long serviceId);

    void deleteByUser_IdAndService_Id(Long userId, Long serviceId);
}
