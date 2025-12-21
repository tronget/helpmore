package org.moysha.managementservice.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.moysha.managementservice.domain.service.ServiceStatus;
import org.moysha.managementservice.domain.service.ServiceType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServiceDto {

    private Long id;
    private Long ownerId;
    private String ownerEmail;
    private Long categoryId;
    private String categoryName;
    private String title;
    private String description;
    private ServiceType type;
    private ServiceStatus status;
    private BigDecimal price;
    private boolean barter;
    private String place;
    private Instant createdAt;
}
