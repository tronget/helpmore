package org.moysha.usermanagementmicroservice.repositories;

import org.moysha.usermanagementmicroservice.models.BugReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BugReportRepository extends JpaRepository<BugReport, Integer> {
    List<BugReport> findByUserId(Integer userId);
}
