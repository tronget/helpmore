package org.moysha.managementservice.api.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateServiceRequest {

    @NotNull
    private Long requesterId;
    private Long categoryId;

    @Size(max = 255)
    private String title;

    @Size(max = 5000)
    private String description;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal price;
    private Boolean barter;

    @Size(max = 255)
    private String place;
}
