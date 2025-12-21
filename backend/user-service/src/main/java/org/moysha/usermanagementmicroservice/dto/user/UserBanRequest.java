package org.moysha.usermanagementmicroservice.dto.user;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBanRequest {

    private OffsetDateTime bannedTill;
}

