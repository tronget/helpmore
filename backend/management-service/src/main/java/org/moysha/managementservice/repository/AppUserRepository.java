package org.moysha.managementservice.repository;

import java.util.Optional;
import org.moysha.managementservice.domain.user.AppUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUserEntity, Long> {

    Optional<AppUserEntity> findByEmail(String email);
}
