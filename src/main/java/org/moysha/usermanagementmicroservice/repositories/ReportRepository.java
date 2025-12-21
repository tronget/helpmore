package org.moysha.usermanagementmicroservice.repositories;

import org.moysha.usermanagementmicroservice.models.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Integer> {
    List<Report> findByReporterId(Integer reporterId);
}
