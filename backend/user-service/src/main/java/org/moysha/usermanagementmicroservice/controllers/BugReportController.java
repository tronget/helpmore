package org.moysha.usermanagementmicroservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.bugreport.BugReportCreateRequest;
import org.moysha.usermanagementmicroservice.dto.bugreport.BugReportResponse;
import org.moysha.usermanagementmicroservice.dto.bugreport.BugReportUpdateRequest;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.services.BugReportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/bug-reports")
@Validated
@RequiredArgsConstructor
public class BugReportController {

    private final BugReportService bugReportService;

    @GetMapping
    public ResponseEntity<List<BugReportResponse>> getAllBugReports() {
        System.err.println("Request: GET /bug-reports");
        return ResponseEntity.ok(bugReportService.getAllBugReports());
    }

    @GetMapping("/me")
    public ResponseEntity<List<BugReportResponse>> getMyBugReports(Authentication authentication) {
        System.err.println("Request: GET /bug-reports/me");
        AppUser user = requireUser(authentication);
        return ResponseEntity.ok(bugReportService.getMyBugReports(user));
    }

    @PostMapping
    public ResponseEntity<BugReportResponse> createBugReport(
            @Valid @RequestBody BugReportCreateRequest request,
            Authentication authentication
    ) {
        System.err.println("Request: POST /bug-reports");
        AppUser user = requireUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bugReportService.createBugReport(user, request));
    }

    @PatchMapping("/{id}")
    public BugReportResponse updateBugReport(
            @PathVariable Integer id,
            @Valid @RequestBody BugReportUpdateRequest request,
            Authentication authentication
    ) {
        System.err.println("Request: PATCH /bug-reports/" + id);
        AppUser user = requireUser(authentication);
        return bugReportService.updateBugReport(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBugReport(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        System.err.println("Request: DELETE /bug-reports/" + id);
        AppUser user = requireUser(authentication);
        bugReportService.deleteBugReport(user, id);
        return ResponseEntity.noContent().build();
    }

    private AppUser requireUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user;
    }
}
