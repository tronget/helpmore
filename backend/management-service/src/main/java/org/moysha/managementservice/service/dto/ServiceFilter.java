package org.moysha.managementservice.service.dto;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.moysha.managementservice.domain.service.ServiceStatus;
import org.moysha.managementservice.domain.service.ServiceType;

@Getter
@AllArgsConstructor
public class ServiceFilter {

    private final Long ownerId;
    private final Long categoryId;
    private final ServiceType type;
    private final ServiceStatus status;
    private final String titleLike;
    private final BigDecimal minPrice;
    private final BigDecimal maxPrice;
    private final Boolean barterOnly;
    private final Instant createdAfter;
    private final Instant createdBefore;
}
