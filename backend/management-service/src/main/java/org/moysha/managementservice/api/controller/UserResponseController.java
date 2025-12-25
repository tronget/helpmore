package org.moysha.managementservice.api.controller;

import org.moysha.managementservice.api.dto.ResponseDto;
import org.moysha.managementservice.domain.response.ResponseStatus;
import org.moysha.managementservice.service.ResponseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserResponseController {

    private final ResponseService responseService;

    public UserResponseController(ResponseService responseService) {
        this.responseService = responseService;
    }

    @GetMapping("/{userId}/responses")
    public Page<ResponseDto> listUserResponses(@PathVariable Long userId, Pageable pageable) {
        System.err.println("GET /api/users/{userId}/responses");
        return responseService.getUserResponses(userId, pageable);
    }

    @GetMapping("/{userId}/responses/active")
    public Page<ResponseDto> listUserActiveResponses(@PathVariable Long userId, Pageable pageable) {
        System.err.println("GET /api/users/{userId}/responses/active");
        return responseService.getUserResponsesByStatus(userId, ResponseStatus.ACTIVE, pageable);
    }

    @GetMapping("/{userId}/responses/archived")
    public Page<ResponseDto> listUserArchivedResponses(@PathVariable Long userId, Pageable pageable) {
        System.err.println("GET /api/users/{userId}/responses/archived");
        return responseService.getUserResponsesByStatus(userId, ResponseStatus.ARCHIVED, pageable);
    }
}
