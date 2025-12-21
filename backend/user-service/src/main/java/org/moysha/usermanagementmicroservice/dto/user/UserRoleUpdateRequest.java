package org.moysha.usermanagementmicroservice.dto.user;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.moysha.usermanagementmicroservice.enums.UserRole;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleUpdateRequest {

    @NotNull
    private UserRole role;
}

