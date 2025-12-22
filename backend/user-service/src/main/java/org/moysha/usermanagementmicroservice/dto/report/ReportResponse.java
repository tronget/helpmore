package org.moysha.usermanagementmicroservice.dto.report;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.moysha.usermanagementmicroservice.enums.ReportType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private Integer id;
    private Integer reporterId;
    private String reporterName;
    private String reporterSurname;
    private Integer reportedUserId;
    private String reportedUserName;
    private String reportedUserSurname;
    private ReportType type;
    private String title;
    private String description;
    private OffsetDateTime createdAt;
}
