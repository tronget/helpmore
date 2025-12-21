package org.moysha.managementservice.api.request;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.moysha.managementservice.domain.service.ServiceStatus;
import org.moysha.managementservice.domain.service.ServiceType;
import org.moysha.managementservice.service.dto.ServiceFilter;

@Getter
@Setter
public class ServiceSearchRequest {

    private Long ownerId;
    private Long categoryId;
    private ServiceType type;
    private ServiceStatus status;
    private String titleLike;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Boolean barterOnly;
    private Instant createdAfter;
    private Instant createdBefore;

    public ServiceFilter toFilter() {
        return new ServiceFilter(ownerId, categoryId, type, status, titleLike, minPrice, maxPrice,
            barterOnly, createdAfter, createdBefore);
    }
}
