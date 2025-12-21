package org.moysha.managementservice.api.mapper;

import org.moysha.managementservice.api.dto.ServiceDto;
import org.moysha.managementservice.domain.service.ServiceEntity;

public final class ServiceMapper {

    private ServiceMapper() {
    }

    public static ServiceDto toDto(ServiceEntity entity) {
        if (entity == null) {
            return null;
        }
        return new ServiceDto(
            entity.getId(),
            entity.getOwner().getId(),
            entity.getOwner().getEmail(),
            entity.getCategory().getId(),
            entity.getCategory().getName(),
            entity.getTitle(),
            entity.getDescription(),
            entity.getType(),
            entity.getStatus(),
            entity.getPrice(),
            entity.isBarter(),
            entity.getPlace(),
            entity.getCreatedAt()
        );
    }
}
