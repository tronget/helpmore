package org.moysha.managementservice.repository;

import org.moysha.managementservice.domain.report.ReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<ReportEntity, Long> {
}
