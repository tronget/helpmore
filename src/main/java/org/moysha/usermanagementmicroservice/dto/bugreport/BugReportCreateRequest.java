package org.moysha.usermanagementmicroservice.dto.bugreport;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BugReportCreateRequest {

    @NotNull
    @Size(max = 255)
    private String title;

    @Size(max = 2048)
    private String description;
}
