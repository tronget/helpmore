package org.moysha.usermanagementmicroservice.services;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.bugreport.BugReportCreateRequest;
import org.moysha.usermanagementmicroservice.dto.bugreport.BugReportResponse;
import org.moysha.usermanagementmicroservice.dto.bugreport.BugReportUpdateRequest;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.models.BugReport;
import org.moysha.usermanagementmicroservice.repositories.BugReportRepository;
import org.moysha.usermanagementmicroservice.repositories.UserInfoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BugReportService {

    private final BugReportRepository bugReportRepository;
    private final UserInfoRepository userInfoRepository;

    public List<BugReportResponse> getAllBugReports() {
        return bugReportRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BugReportResponse> getMyBugReports(AppUser user) {
        return bugReportRepository.findByUserId(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BugReportResponse createBugReport(AppUser user, BugReportCreateRequest request) {
        BugReport report = BugReport.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        bugReportRepository.save(report);
        return toResponse(report);
    }

    @Transactional
    public BugReportResponse updateBugReport(AppUser user, Integer reportId, BugReportUpdateRequest request) {
        BugReport report = findReport(reportId);
        if (!report.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (request.getTitle() != null) {
            report.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            report.setDescription(request.getDescription());
        }

        bugReportRepository.save(report);
        return toResponse(report);
    }

    @Transactional
    public void deleteBugReport(AppUser user, Integer reportId) {
        BugReport report = findReport(reportId);
        if (!report.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        bugReportRepository.delete(report);
    }

    private BugReport findReport(Integer reportId) {
        return bugReportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "BugReport %d not found".formatted(reportId)
                ));
    }

    private BugReportResponse toResponse(BugReport report) {
        var info = userInfoRepository.findByUserId(report.getUser().getId()).orElse(null);
        return new BugReportResponse(
                report.getId(),
                report.getUser().getId(),
                info != null ? info.getName() : null,
                info != null ? info.getSurname() : null,
                report.getTitle(),
                report.getDescription(),
                report.getCreatedAt()
        );
    }
}
