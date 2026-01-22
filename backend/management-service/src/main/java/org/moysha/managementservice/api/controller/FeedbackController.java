package org.moysha.managementservice.api.controller;

import jakarta.validation.Valid;
import org.moysha.managementservice.api.dto.FeedbackDto;
import org.moysha.managementservice.api.request.CreateFeedbackRequest;
import org.moysha.managementservice.api.request.UpdateFeedbackRequest;
import org.moysha.managementservice.service.FeedbackService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services/{serviceId}/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    public Page<FeedbackDto> list(@PathVariable Long serviceId, Pageable pageable) {
        System.err.println("GET /api/services/{serviceId}/feedback");
        return feedbackService.getByService(serviceId, pageable);
    }

    @PostMapping
    public FeedbackDto create(@PathVariable Long serviceId,
                              @Valid @RequestBody CreateFeedbackRequest request) {
        System.err.println("POST /api/services/{serviceId}/feedback");
        return feedbackService.create(serviceId, request);
    }

    @PutMapping("/{feedbackId}")
    public FeedbackDto update(@PathVariable Long serviceId,
                              @PathVariable Long feedbackId,
                              @Valid @RequestBody UpdateFeedbackRequest request) {
        System.err.println("PUT /api/services/{serviceId}/feedback/{feedbackId}");
        return feedbackService.update(feedbackId, request);
    }

    @DeleteMapping("/{feedbackId}")
    public void delete(@PathVariable Long serviceId,
                       @PathVariable Long feedbackId,
                       @RequestParam Long requesterId) {
        System.err.println("DELETE /api/services/{serviceId}/feedback/{feedbackId}");
        feedbackService.delete(feedbackId, requesterId);
    }
}
