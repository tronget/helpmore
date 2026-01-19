package org.moysha.usermanagementmicroservice.services;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.moysha.usermanagementmicroservice.IntegrationTestBase;
import org.moysha.usermanagementmicroservice.dto.report.ReportCreateRequest;
import org.moysha.usermanagementmicroservice.enums.ReportType;
import org.moysha.usermanagementmicroservice.enums.UserRole;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.models.UserInfo;
import org.moysha.usermanagementmicroservice.repositories.UserInfoRepository;
import org.moysha.usermanagementmicroservice.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;

class ReportServiceTest extends IntegrationTestBase {

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Test
    void createReportReturnsReporterAndReportedNames() {
        AppUser reporter = saveUser("reporter@itmo.ru", "token-reporter");
        AppUser reported = saveUser("reported@itmo.ru", "token-reported");

        UserInfo reporterInfo = new UserInfo();
        reporterInfo.setUser(reporter);
        reporterInfo.setName("Илья");
        reporterInfo.setSurname("Покалюхин");
        userInfoRepository.save(reporterInfo);

        UserInfo reportedInfo = new UserInfo();
        reportedInfo.setUser(reported);
        reportedInfo.setName("Андрей");
        reportedInfo.setSurname("Лашкул");
        userInfoRepository.save(reportedInfo);

        ReportCreateRequest request = new ReportCreateRequest(
            reported.getId(),
            ReportType.fraud,
            "Подозрительная активность",
            "Пользователь просит перевести деньги"
        );

        var response = reportService.createReport(reporter, request);

        assertThat(response.getReporterId()).isEqualTo(reporter.getId());
        assertThat(response.getReporterName()).isEqualTo("Илья");
        assertThat(response.getReporterSurname()).isEqualTo("Покалюхин");
        assertThat(response.getReportedUserId()).isEqualTo(reported.getId());
        assertThat(response.getReportedUserName()).isEqualTo("Андрей");
        assertThat(response.getReportedUserSurname()).isEqualTo("Лашкул");
        assertThat(response.getType()).isEqualTo(ReportType.fraud);
    }

    private AppUser saveUser(String email, String token) {
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setToken(token);
        user.setRole(UserRole.user);
        return userRepository.save(user);
    }
}
