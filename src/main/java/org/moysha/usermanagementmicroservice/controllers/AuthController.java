package org.moysha.usermanagementmicroservice.controllers;

import jakarta.servlet.ServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.YandexTokenRequest;
import org.moysha.usermanagementmicroservice.dto.YandexUserInfo;
import org.moysha.usermanagementmicroservice.services.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor

public class AuthController {
    private final AuthService authService;


    @PostMapping("/yandex")
    public ResponseEntity<String> authenticateWithYandex(@RequestBody YandexTokenRequest request) {
        try {
            ResponseEntity<String> response = authService.loginUser(request);
            return response;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        }
    }

}
