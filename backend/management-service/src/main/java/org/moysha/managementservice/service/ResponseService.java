package org.moysha.managementservice.service;

import org.moysha.managementservice.api.dto.ResponseDto;
import org.moysha.managementservice.api.request.CreateResponseRequest;
import org.moysha.managementservice.domain.response.ResponseEntity;
import org.moysha.managementservice.domain.response.ResponseStatus;
import org.moysha.managementservice.domain.service.ServiceEntity;
import org.moysha.managementservice.domain.user.AppUserEntity;
import org.moysha.managementservice.exception.BadRequestException;
import org.moysha.managementservice.exception.ConflictException;
import org.moysha.managementservice.exception.NotFoundException;
import org.moysha.managementservice.repository.AppUserRepository;
import org.moysha.managementservice.repository.ResponseRepository;
import org.moysha.managementservice.repository.ServiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResponseService {

    private final ResponseRepository responseRepository;
    private final ServiceRepository serviceRepository;
    private final AppUserRepository appUserRepository;

    public ResponseService(ResponseRepository responseRepository,
                           ServiceRepository serviceRepository,
                           AppUserRepository appUserRepository) {
        this.responseRepository = responseRepository;
        this.serviceRepository = serviceRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public ResponseDto respond(Long serviceId, CreateResponseRequest request) {
        ServiceEntity service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new NotFoundException("Service not found: " + serviceId));
        if (service.getOwner().getId().equals(request.getSenderId())) {
            throw new BadRequestException("Owner cannot respond to own service");
        }
        AppUserEntity sender = appUserRepository.findById(request.getSenderId())
            .orElseThrow(() -> new NotFoundException("User not found: " + request.getSenderId()));

        ResponseEntity entity = responseRepository.findBySender_IdAndService_Id(request.getSenderId(), serviceId)
            .orElseGet(ResponseEntity::new);
        if (entity.getId() != null && entity.getStatus() == ResponseStatus.ACTIVE) {
            throw new ConflictException("Response already exists");
        }
        entity.setService(service);
        entity.setSender(sender);
        entity.setStatus(ResponseStatus.ACTIVE);

        return toDto(responseRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public Page<ResponseDto> getResponses(Long serviceId, Pageable pageable) {
        return responseRepository.findByService_Id(serviceId, pageable)
            .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ResponseDto> getResponsesByStatus(Long serviceId, ResponseStatus status, Pageable pageable) {
        return responseRepository.findByService_IdAndStatus(serviceId, status, pageable)
            .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ResponseDto> getUserResponses(Long userId, Pageable pageable) {
        return responseRepository.findBySender_IdOrService_Owner_Id(userId, userId, pageable)
            .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ResponseDto> getUserResponsesByStatus(Long userId, ResponseStatus status, Pageable pageable) {
        return responseRepository.findByUserAndStatus(userId, status, pageable)
            .map(this::toDto);
    }

    @Transactional
    public void delete(Long responseId, Long requesterId) {
        ResponseEntity entity = responseRepository.findById(responseId)
            .orElseThrow(() -> new NotFoundException("Response not found: " + responseId));
        if (entity.getStatus() != ResponseStatus.ACTIVE) {
            throw new BadRequestException("Only active response can be deleted");
        }
        if (!entity.getSender().getId().equals(requesterId)
            && !entity.getService().getOwner().getId().equals(requesterId)) {
            throw new BadRequestException("Only author or service owner can delete response");
        }
        responseRepository.delete(entity);
    }

    @Transactional
    public ResponseDto changeStatus(Long responseId, ResponseStatus status, Long requesterId) {
        ResponseEntity entity = responseRepository.findById(responseId)
            .orElseThrow(() -> new NotFoundException("Response not found: " + responseId));
        if (status != ResponseStatus.ARCHIVED) {
            throw new BadRequestException("Only archiving is allowed");
        }
        if (!entity.getSender().getId().equals(requesterId)
            && !entity.getService().getOwner().getId().equals(requesterId)) {
            throw new BadRequestException("Only author or service owner can change response status");
        }
        if (entity.getStatus() == ResponseStatus.ARCHIVED) {
            throw new BadRequestException("Response already archived");
        }
        entity.setStatus(ResponseStatus.ARCHIVED);
        return toDto(responseRepository.save(entity));
    }

    private ResponseDto toDto(ResponseEntity entity) {
        return new ResponseDto(
            entity.getId(),
            entity.getService().getId(),
            entity.getSender().getId(),
            entity.getStatus(),
            entity.getCreatedAt()
        );
    }
}
