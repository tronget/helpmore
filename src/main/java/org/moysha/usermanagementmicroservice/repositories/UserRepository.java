package org.moysha.usermanagementmicroservice.repositories;

import jakarta.transaction.Transactional;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<AppUser, Integer> {
    boolean existsById(Integer id);
    Optional<AppUser> findById(Integer id);

    Optional<AppUser> findByEmail(String email);



    @Modifying
    @Transactional
    @Query("UPDATE AppUser u SET u.bannedTill = :bannedTill WHERE u.id = :id")
    int updateUserBannedTill(Integer id, OffsetDateTime bannedTill);

    @Modifying
    @Transactional
    @Query("UPDATE AppUser u SET u.token = :token WHERE u.id = :id")
    int updateUserToken(Integer id, String token);
}
