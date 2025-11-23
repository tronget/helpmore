package org.moysha.usermanagementmicroservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.moysha.usermanagementmicroservice.dto.YandexTokenRequest;
import org.moysha.usermanagementmicroservice.dto.YandexUserInfo;
import org.moysha.usermanagementmicroservice.enums.UserRole;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.models.UserInfo;
import org.moysha.usermanagementmicroservice.repositories.UserInfoRepository;
import org.moysha.usermanagementmicroservice.repositories.UserRepository;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.OffsetDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserInfoRepository userInfoRepository;
    private final RestTemplate restTemplate;

    @Value("${YANDEX_INFO_URL}")
    private String yandexInfoUrl;

    @Transactional
    public ResponseEntity<String> loginUser(YandexTokenRequest request) {
        YandexUserInfo yandexUserInfo = getYandexUserInfo(request.getToken());

        String email = yandexUserInfo.getDefaultEmail();
        if (email == null || email.isBlank()) {
            System.err.println("Yandex user has no email: {}"+ yandexUserInfo);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email is required for login");
        }

        Optional<AppUser> optionalUser = userRepository.findByEmail(email);
        AppUser user;

        if (optionalUser.isEmpty()) {
            user = createUser(yandexUserInfo, request.getToken());
            System.err.println("Created new user with email {}"+ email);
        } else {
            user = optionalUser.get();

            OffsetDateTime bannedTill = user.getBannedTill();
            if (bannedTill != null && !bannedTill.isBefore(OffsetDateTime.now())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("User is banned until " + bannedTill);
            }

            // обновляем токен
            user.setToken(request.getToken());
            userRepository.save(user);
            System.err.println("Updated token for user with email {}"+ email);
        }

        return ResponseEntity.ok("OK");
    }

    @Transactional
    public AppUser createUser(YandexUserInfo yandexUserInfo, String oauthToken) {
        String email = yandexUserInfo.getDefaultEmail();

        AppUser appUser = AppUser.builder()
                .token(oauthToken)
                .email(email)
                .role(UserRole.user)
                .build();
        appUser = userRepository.save(appUser);

        String phone = null;
        if (yandexUserInfo.getDefaultPhone() != null) {
            phone = yandexUserInfo.getDefaultPhone().getNumber();
        }

        UserInfo userInfo = UserInfo.builder()
                .user(appUser)
                .name(yandexUserInfo.getFirstName())
                .surname(yandexUserInfo.getLastName())
                .phoneNumber(phone)
                .build();
        userInfoRepository.save(userInfo);

        return appUser;
    }

    public YandexUserInfo getYandexUserInfo(String oauthToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "OAuth " + oauthToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<YandexUserInfo> response = restTemplate.exchange(
                    yandexInfoUrl,
                    HttpMethod.GET,
                    entity,
                    YandexUserInfo.class
            );

            YandexUserInfo body = response.getBody();
            return body;
        } catch (HttpClientErrorException e) {
            throw e;
        }
    }
}
