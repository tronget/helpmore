package org.moysha.usermanagementmicroservice.controllers;

import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.YandexTokenRequest;
import org.moysha.usermanagementmicroservice.dto.user.UserResponse;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.services.AuthService;
import org.moysha.usermanagementmicroservice.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/yandex")
    public ResponseEntity<String> authenticateWithYandex(@RequestBody YandexTokenRequest request) {
        System.err.println("Request: POST /auth/yandex");
        try {
            ResponseEntity<String> response = authService.loginUser(request);
            return response;
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        }
    }

//    @GetMapping("/check")
//    public ResponseEntity<UserResponse> checkAuthorization(Authentication authentication) {
//        if (authentication == null || !(authentication.getPrincipal() instanceof AppUser)) {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
//        }
//        return ResponseEntity.status(HttpStatus.OK).build();
//    }
}
