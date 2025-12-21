package org.moysha.usermanagementmicroservice.dto.bugreport;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BugReportUpdateRequest {

    @Size(max = 255)
    private String title;

    @Size(max = 2048)
    private String description;
}
