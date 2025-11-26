package org.moysha.usermanagementmicroservice.repositories;

import org.moysha.usermanagementmicroservice.models.UserInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserInfoRepository extends JpaRepository<UserInfo, Integer> {

    Optional<UserInfo> findByUserId(Integer userId);

    List<UserInfo> findByUserIdIn(Collection<Integer> userIds);

    void deleteByUserId(Integer userId);

}
