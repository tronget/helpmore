package org.moysha.usermanagementmicroservice.services;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.moysha.usermanagementmicroservice.IntegrationTestBase;
import org.moysha.usermanagementmicroservice.dto.user.UserProfileRequest;
import org.moysha.usermanagementmicroservice.dto.user.UserResponse;
import org.moysha.usermanagementmicroservice.enums.UserRole;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.models.UserInfo;
import org.moysha.usermanagementmicroservice.repositories.UserInfoRepository;
import org.moysha.usermanagementmicroservice.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;

class UserServiceTest extends IntegrationTestBase {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Test
    void updateProfileCreatesAndUpdatesUserInfo() {
        AppUser user = saveUser("user1@example.com", "token-1");

        UserProfileRequest createRequest = new UserProfileRequest(
            "Илья",
            "Покалюхин",
            "Игоревич",
            null,
            "ИТМО",
            "Краткое описание профиля.",
            "+79990001122",
            "@ilya"
        );

        UserResponse created = userService.updateProfile(user.getId(), createRequest);
        assertThat(created.getProfile()).isNotNull();
        assertThat(created.getProfile().getBio()).isEqualTo("Краткое описание профиля.");

        UserInfo stored = userInfoRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(stored.getFaculty()).isEqualTo("ИТМО");
        assertThat(stored.getBio()).contains("описание");

        UserProfileRequest updateRequest = new UserProfileRequest(
            "Илья",
            "Покалюхин",
            "Игоревич",
            null,
            "Новый факультет",
            "Обновленное био.",
            null,
            null
        );

        userService.updateProfile(user.getId(), updateRequest);
        UserInfo updated = userInfoRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(updated.getFaculty()).isEqualTo("Новый факультет");
        assertThat(updated.getBio()).isEqualTo("Обновленное био.");
    }

    @Test
    void updateBanStatusSetsBannedTillAndToken() {
        AppUser user = saveUser("user2@example.com", "token-2");
        OffsetDateTime bannedTill = OffsetDateTime.now().plusDays(7);

        userService.updateBanStatus(user.getId(), bannedTill);

        AppUser updated = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updated.getBannedTill()).isEqualTo(bannedTill);
        assertThat(updated.getToken()).isEqualTo("BANNED_" + user.getId());
    }

    @Test
    void getCurrentUserReturnsProfileWhenPresent() {
        AppUser user = saveUser("user3@example.com", "token-3");
        UserInfo info = new UserInfo();
        info.setUser(user);
        info.setName("Анна");
        info.setSurname("Соколова");
        info.setPhoneNumber("+79990001111");
        info.setTelegram("@anna");
        userInfoRepository.save(info);

        var response = userService.getCurrentUser(user);

        assertThat(response.getId()).isEqualTo(user.getId());
        assertThat(response.getName()).isEqualTo("Анна");
        assertThat(response.getSurname()).isEqualTo("Соколова");
        assertThat(response.getPhoneNumber()).isEqualTo("+79990001111");
        assertThat(response.getTelegram()).isEqualTo("@anna");
    }

    @Test
    void getCurrentUserAllowsMissingProfile() {
        AppUser user = saveUser("user4@example.com", "token-4");

        var response = userService.getCurrentUser(user);

        assertThat(response.getId()).isEqualTo(user.getId());
        assertThat(response.getName()).isNull();
        assertThat(response.getSurname()).isNull();
    }

    private AppUser saveUser(String email, String token) {
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setToken(token);
        user.setRole(UserRole.user);
        return userRepository.save(user);
    }
}
