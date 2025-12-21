package org.moysha.usermanagementmicroservice.dto.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.moysha.usermanagementmicroservice.enums.ReportType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportCreateRequest {

    @NotNull
    private Integer reportedUserId;

    @NotNull
    private ReportType type;

    @NotNull
    @Size(max = 255)
    private String title;

    @Size(max = 2048)
    private String description;
}
