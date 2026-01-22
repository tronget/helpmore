package org.moysha.usermanagementmicroservice.services;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.report.ReportCreateRequest;
import org.moysha.usermanagementmicroservice.dto.report.ReportResponse;
import org.moysha.usermanagementmicroservice.dto.report.ReportUpdateRequest;
import org.moysha.usermanagementmicroservice.enums.UserRole;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.models.Report;
import org.moysha.usermanagementmicroservice.repositories.ReportRepository;
import org.moysha.usermanagementmicroservice.repositories.UserInfoRepository;
import org.moysha.usermanagementmicroservice.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final UserInfoRepository userInfoRepository;

    public List<ReportResponse> getReportsForUser(AppUser user) {
        return reportRepository.findByReporterId(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReportResponse createReport(AppUser reporter, ReportCreateRequest request) {
        AppUser reportedUser = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "User %d not found".formatted(request.getReportedUserId())
                ));

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .type(request.getType())
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        reportRepository.save(report);
        return toResponse(report);
    }

    @Transactional
    public ReportResponse updateReport(AppUser actor, Integer reportId, ReportUpdateRequest request) {
        Report report = findReport(reportId);
        ensureCanModify(actor, report);

        if (request.getType() != null) {
            report.setType(request.getType());
        }
        if (request.getTitle() != null) {
            report.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            report.setDescription(request.getDescription());
        }

        reportRepository.save(report);
        return toResponse(report);
    }

    @Transactional
    public void deleteReport(AppUser actor, Integer reportId) {
        Report report = findReport(reportId);
        ensureCanModify(actor, report);
        reportRepository.delete(report);
    }

    private Report findReport(Integer reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Report %d not found".formatted(reportId)
                ));
    }

    private void ensureCanModify(AppUser actor, Report report) {
        boolean isOwner = report.getReporter().getId().equals(actor.getId());
        boolean isPrivileged = actor.getRole() == UserRole.admin || actor.getRole() == UserRole.moderator;
        if (!isOwner && !isPrivileged) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to modify this report");
        }
    }

    private ReportResponse toResponse(Report report) {
        var reporterInfo = userInfoRepository.findByUserId(report.getReporter().getId()).orElse(null);
        var reportedInfo = userInfoRepository.findByUserId(report.getReportedUser().getId()).orElse(null);

        return new ReportResponse(
                report.getId(),
                report.getReporter().getId(),
                reporterInfo != null ? reporterInfo.getName() : null,
                reporterInfo != null ? reporterInfo.getSurname() : null,
                report.getReportedUser().getId(),
                reportedInfo != null ? reportedInfo.getName() : null,
                reportedInfo != null ? reportedInfo.getSurname() : null,
                report.getType(),
                report.getTitle(),
                report.getDescription(),
                report.getCreatedAt()
        );
    }
}
