package org.moysha.usermanagementmicroservice;

import org.junit.jupiter.api.BeforeEach;
import org.moysha.usermanagementmicroservice.repositories.BugReportRepository;
import org.moysha.usermanagementmicroservice.repositories.ReportRepository;
import org.moysha.usermanagementmicroservice.repositories.UserInfoRepository;
import org.moysha.usermanagementmicroservice.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
@SpringBootTest
public abstract class IntegrationTestBase {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private BugReportRepository bugReportRepository;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void resetDatabase() {
        reportRepository.deleteAll();
        bugReportRepository.deleteAll();
        userInfoRepository.deleteAll();
        userRepository.deleteAll();
    }
}
