package org.moysha.usermanagementmicroservice.dto.user;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRateRequest {

    private Integer userId;

    @NotNull
    private Integer newMark;

}
