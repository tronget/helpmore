package org.moysha.usermanagementmicroservice.dto.user;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserMeResponse {

    private Integer id;
    private String email;
    private String role;
    private String name;
    private String surname;
    private String phoneNumber;
    private String telegram;
    private BigDecimal rate;
}
