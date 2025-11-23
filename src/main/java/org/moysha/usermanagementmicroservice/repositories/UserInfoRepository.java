package org.moysha.usermanagementmicroservice.repositories;

import org.moysha.usermanagementmicroservice.models.UserInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserInfoRepository extends JpaRepository<UserInfo, Integer> {


}
