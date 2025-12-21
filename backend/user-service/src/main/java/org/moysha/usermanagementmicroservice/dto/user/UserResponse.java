package org.moysha.usermanagementmicroservice.dto.user;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.moysha.usermanagementmicroservice.enums.UserRole;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Integer id;
    private String email;
    private UserRole role;
    private OffsetDateTime bannedTill;
    private OffsetDateTime createdAt;
    private UserProfileResponse profile;
}
