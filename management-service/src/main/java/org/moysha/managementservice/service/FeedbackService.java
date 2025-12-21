package org.moysha.managementservice.service;

import org.moysha.managementservice.api.dto.FeedbackDto;
import org.moysha.managementservice.api.mapper.FeedbackMapper;
import org.moysha.managementservice.api.request.CreateFeedbackRequest;
import org.moysha.managementservice.api.request.UpdateFeedbackRequest;
import org.moysha.managementservice.domain.feedback.FeedbackEntity;
import org.moysha.managementservice.domain.service.ServiceEntity;
import org.moysha.managementservice.domain.user.AppUserEntity;
import org.moysha.managementservice.exception.BadRequestException;
import org.moysha.managementservice.exception.ConflictException;
import org.moysha.managementservice.exception.NotFoundException;
import org.moysha.managementservice.repository.AppUserRepository;
import org.moysha.managementservice.repository.FeedbackRepository;
import org.moysha.managementservice.repository.ServiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final ServiceRepository serviceRepository;
    private final AppUserRepository appUserRepository;

    public FeedbackService(FeedbackRepository feedbackRepository,
                           ServiceRepository serviceRepository,
                           AppUserRepository appUserRepository) {
        this.feedbackRepository = feedbackRepository;
        this.serviceRepository = serviceRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public FeedbackDto create(Long serviceId, CreateFeedbackRequest request) {
        ServiceEntity service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new NotFoundException("Service not found: " + serviceId));
        if (service.getOwner().getId().equals(request.getSenderId())) {
            throw new BadRequestException("Owner cannot rate own service");
        }
        if (feedbackRepository.existsBySender_IdAndService_Id(request.getSenderId(), serviceId)) {
            throw new ConflictException("Feedback already exists for user %s".formatted(request.getSenderId()));
        }
        AppUserEntity sender = appUserRepository.findById(request.getSenderId())
            .orElseThrow(() -> new NotFoundException("User not found: " + request.getSenderId()));

        FeedbackEntity entity = new FeedbackEntity();
        entity.setService(service);
        entity.setSender(sender);
        entity.setRate(request.getRate());
        entity.setReview(request.getReview());

        return FeedbackMapper.toDto(feedbackRepository.save(entity));
    }

    @Transactional
    public FeedbackDto update(Long feedbackId, UpdateFeedbackRequest request) {
        FeedbackEntity entity = feedbackRepository.findById(feedbackId)
            .orElseThrow(() -> new NotFoundException("Feedback not found: " + feedbackId));
        if (!entity.getSender().getId().equals(request.getSenderId())) {
            throw new BadRequestException("Only author can update feedback");
        }
        entity.setRate(request.getRate());
        entity.setReview(request.getReview());
        return FeedbackMapper.toDto(feedbackRepository.save(entity));
    }

    @Transactional
    public void delete(Long feedbackId, Long requesterId) {
        FeedbackEntity entity = feedbackRepository.findById(feedbackId)
            .orElseThrow(() -> new NotFoundException("Feedback not found: " + feedbackId));
        if (!entity.getSender().getId().equals(requesterId)
            && !entity.getService().getOwner().getId().equals(requesterId)) {
            throw new BadRequestException("Only author or service owner can delete feedback");
        }
        feedbackRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public Page<FeedbackDto> getByService(Long serviceId, Pageable pageable) {
        return feedbackRepository.findByService_Id(serviceId, pageable)
            .map(FeedbackMapper::toDto);
    }
}
