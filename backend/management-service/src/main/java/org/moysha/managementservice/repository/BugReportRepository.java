package org.moysha.managementservice.repository;

import org.moysha.managementservice.domain.report.BugReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BugReportRepository extends JpaRepository<BugReportEntity, Long> {
}
