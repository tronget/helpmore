package org.moysha.usermanagementmicroservice.dto.user;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private String name;
    private String surname;
    private String middleName;
    private byte[] avatar;
    private String faculty;
    private String bio;
    private String phoneNumber;
    private String telegram;
    private BigDecimal rate;
}
