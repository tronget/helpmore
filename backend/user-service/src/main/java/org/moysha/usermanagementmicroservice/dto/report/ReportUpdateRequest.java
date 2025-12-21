package org.moysha.usermanagementmicroservice.dto.report;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.moysha.usermanagementmicroservice.enums.ReportType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportUpdateRequest {

    private ReportType type;

    @Size(max = 255)
    private String title;

    @Size(max = 2048)
    private String description;
}
