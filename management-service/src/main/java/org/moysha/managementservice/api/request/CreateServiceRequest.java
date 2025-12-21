package org.moysha.managementservice.api.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.moysha.managementservice.domain.service.ServiceType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateServiceRequest {

    @NotNull
    private Long ownerId;

    @NotNull
    private Long categoryId;

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    @Size(max = 5000)
    private String description;

    @NotNull
    private ServiceType type;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal price;

    @NotNull
    private Boolean barter;

    @Size(max = 255)
    private String place;
}
