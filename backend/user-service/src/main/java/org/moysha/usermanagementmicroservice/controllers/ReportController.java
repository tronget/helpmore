package org.moysha.usermanagementmicroservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.report.ReportCreateRequest;
import org.moysha.usermanagementmicroservice.dto.report.ReportResponse;
import org.moysha.usermanagementmicroservice.dto.report.ReportUpdateRequest;
import org.moysha.usermanagementmicroservice.enums.UserRole;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.services.ReportService;
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
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/reports")
@Validated
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/me")
    public ResponseEntity<List<ReportResponse>> getMyReports(Authentication authentication) {
        System.err.println("Request: GET /reports/me");
        AppUser user = requireUser(authentication);
        return ResponseEntity.ok(reportService.getReportsForUser(user));
    }

    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAllReports(Authentication authentication) {
        System.err.println("Request: GET /reports");
        AppUser user = requireUser(authentication);
        if (user.getRole() != UserRole.admin && user.getRole() != UserRole.moderator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @PostMapping
    public ResponseEntity<ReportResponse> createReport(
            @Valid @RequestBody ReportCreateRequest request,
            Authentication authentication
    ) {
        System.err.println("Request: POST /reports");
        AppUser user = requireUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.createReport(user, request));
    }

    @PatchMapping("/{id}")
    public ReportResponse updateReport(
            @PathVariable Integer id,
            @Valid @RequestBody ReportUpdateRequest request,
            Authentication authentication
    ) {
        System.err.println("Request: PATCH /reports/" + id);
        AppUser user = requireUser(authentication);
        return reportService.updateReport(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        System.err.println("Request: DELETE /reports/" + id);
        AppUser user = requireUser(authentication);
        reportService.deleteReport(user, id);
        return ResponseEntity.noContent().build();
    }





    private AppUser requireUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user;
    }
}
