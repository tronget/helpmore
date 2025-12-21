package org.moysha.managementservice.api.controller;

import jakarta.validation.Valid;
import org.moysha.managementservice.api.dto.ResponseDto;
import org.moysha.managementservice.api.request.CreateResponseRequest;
import org.moysha.managementservice.service.ResponseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services/{serviceId}/responses")
public class ResponseController {

    private final ResponseService responseService;

    public ResponseController(ResponseService responseService) {
        this.responseService = responseService;
    }

    @GetMapping
    public Page<ResponseDto> list(@PathVariable Long serviceId, Pageable pageable) {
        System.err.println("GET /api/services/{serviceId}/responses");
        return responseService.getResponses(serviceId, pageable);
    }

    @PostMapping
    public ResponseDto respond(@PathVariable Long serviceId,
                               @Valid @RequestBody CreateResponseRequest request) {
        System.err.println("POST /api/services/{serviceId}/responses");
        return responseService.respond(serviceId, request);
    }

    @DeleteMapping("/{responseId}")
    public void delete(@PathVariable Long serviceId,
                       @PathVariable Long responseId,
                       @RequestParam Long requesterId) {
        System.err.println("DELETE /api/services/{serviceId}/responses/{responseId}");
        responseService.delete(responseId, requesterId);
    }
}
