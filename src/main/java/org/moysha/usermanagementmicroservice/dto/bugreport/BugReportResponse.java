package org.moysha.usermanagementmicroservice.dto.bugreport;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BugReportResponse {

    private Integer id;
    private Integer userId;
    private String userName;
    private String userSurname;
    private String title;
    private String description;
    private OffsetDateTime createdAt;
}
