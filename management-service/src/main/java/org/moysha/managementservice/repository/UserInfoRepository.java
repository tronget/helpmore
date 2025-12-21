package org.moysha.managementservice.repository;

import java.util.Optional;
import org.moysha.managementservice.domain.user.UserInfoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserInfoRepository extends JpaRepository<UserInfoEntity, Long> {

    Optional<UserInfoEntity> findByUserId(Long userId);
}
