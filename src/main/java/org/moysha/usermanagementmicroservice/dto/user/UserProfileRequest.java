package org.moysha.usermanagementmicroservice.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Size(max = 120)
    private String surname;

    @Size(max = 120)
    private String middleName;

    private byte[] avatar;

    @Size(max = 160)
    private String faculty;

    @Size(max = 32)
    private String phoneNumber;

    @Size(max = 64)
    private String telegram;
}
