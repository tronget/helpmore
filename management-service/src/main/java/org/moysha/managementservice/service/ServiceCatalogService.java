package org.moysha.managementservice.service;

import java.util.Objects;
import org.moysha.managementservice.api.dto.ServiceDto;
import org.moysha.managementservice.api.mapper.ServiceMapper;
import org.moysha.managementservice.api.request.CreateServiceRequest;
import org.moysha.managementservice.api.request.UpdateServiceRequest;
import org.moysha.managementservice.domain.category.CategoryEntity;
import org.moysha.managementservice.domain.service.ServiceEntity;
import org.moysha.managementservice.domain.service.ServiceStatus;
import org.moysha.managementservice.domain.user.AppUserEntity;
import org.moysha.managementservice.exception.BadRequestException;
import org.moysha.managementservice.exception.NotFoundException;
import org.moysha.managementservice.repository.AppUserRepository;
import org.moysha.managementservice.repository.CategoryRepository;
import org.moysha.managementservice.repository.ServiceRepository;
import org.moysha.managementservice.service.dto.ServiceFilter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;
    private final AppUserRepository appUserRepository;

    public ServiceCatalogService(ServiceRepository serviceRepository,
                                 CategoryRepository categoryRepository,
                                 AppUserRepository appUserRepository) {
        this.serviceRepository = serviceRepository;
        this.categoryRepository = categoryRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public ServiceDto create(CreateServiceRequest request) {
        AppUserEntity owner = appUserRepository.findById(request.getOwnerId())
            .orElseThrow(() -> new NotFoundException("Owner not found: " + request.getOwnerId()));
        CategoryEntity category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new NotFoundException("Category not found: " + request.getCategoryId()));

        ServiceEntity entity = new ServiceEntity();
        entity.setOwner(owner);
        entity.setCategory(category);
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setType(request.getType());
        entity.setPrice(request.getPrice());
        entity.setBarter(Boolean.TRUE.equals(request.getBarter()));
        entity.setPlace(request.getPlace());
        entity.setStatus(ServiceStatus.ACTIVE);

        return ServiceMapper.toDto(serviceRepository.save(entity));
    }

    @Transactional
    public ServiceDto update(Long serviceId, UpdateServiceRequest request) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new NotFoundException("Service not found: " + serviceId));
        if (!Objects.equals(entity.getOwner().getId(), request.getRequesterId())) {
            throw new BadRequestException("Only owner can update the service");
        }

        if (request.getCategoryId() != null && !request.getCategoryId().equals(entity.getCategory().getId())) {
            CategoryEntity category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found: " + request.getCategoryId()));
            entity.setCategory(category);
        }

        if (request.getTitle() != null) {
            entity.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            entity.setPrice(request.getPrice());
        }
        if (request.getBarter() != null) {
            entity.setBarter(request.getBarter());
        }
        if (request.getPlace() != null) {
            entity.setPlace(request.getPlace());
        }

        return ServiceMapper.toDto(serviceRepository.save(entity));
    }

    @Transactional
    public void archive(Long serviceId, Long requesterId) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new NotFoundException("Service not found: " + serviceId));
        if (!Objects.equals(entity.getOwner().getId(), requesterId)) {
            throw new BadRequestException("Only owner can archive the service");
        }
        entity.setStatus(ServiceStatus.ARCHIVED);
        serviceRepository.save(entity);
    }

    @Transactional
    public void delete(Long serviceId, Long requesterId) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new NotFoundException("Service not found: " + serviceId));
        if (!Objects.equals(entity.getOwner().getId(), requesterId)) {
            throw new BadRequestException("Only owner can delete the service");
        }
        serviceRepository.delete(entity);
    }

    @Transactional
    public ServiceDto changeStatus(Long serviceId, ServiceStatus status, Long requesterId) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new NotFoundException("Service not found: " + serviceId));
        if (!Objects.equals(entity.getOwner().getId(), requesterId)) {
            throw new BadRequestException("Only owner can change status");
        }
        entity.setStatus(status);
        return ServiceMapper.toDto(serviceRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public ServiceDto getById(Long serviceId) {
        return serviceRepository.findById(serviceId)
            .map(ServiceMapper::toDto)
            .orElseThrow(() -> new NotFoundException("Service not found: " + serviceId));
    }

    @Transactional(readOnly = true)
    public Page<ServiceDto> search(ServiceFilter filter, Pageable pageable) {
        Specification<ServiceEntity> spec = buildSpecification(filter);
        return serviceRepository.findAll(spec, pageable)
            .map(ServiceMapper::toDto);
    }

    private Specification<ServiceEntity> buildSpecification(ServiceFilter filter) {
        Specification<ServiceEntity> spec = (root, query, cb) -> cb.conjunction();
        if (filter == null) {
            return spec;
        }
        if (filter.getOwnerId() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("owner").get("id"), filter.getOwnerId()));
        }
        if (filter.getCategoryId() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), filter.getCategoryId()));
        }
        if (filter.getType() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), filter.getType()));
        }
        if (filter.getStatus() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), filter.getStatus()));
        }
        if (filter.getTitleLike() != null && !filter.getTitleLike().isBlank()) {
            String pattern = "%" + filter.getTitleLike().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), pattern));
        }
        if (filter.getMinPrice() != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
        }
        if (filter.getMaxPrice() != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
        }
        if (Boolean.TRUE.equals(filter.getBarterOnly())) {
            spec = spec.and((root, query, cb) -> cb.isTrue(root.get("barter")));
        }
        if (filter.getCreatedAfter() != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedAfter()));
        }
        if (filter.getCreatedBefore() != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedBefore()));
        }
        return spec;
    }
}
