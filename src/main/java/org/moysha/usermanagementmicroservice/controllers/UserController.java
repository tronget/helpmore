package org.moysha.usermanagementmicroservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.user.UserBanRequest;
import org.moysha.usermanagementmicroservice.dto.user.UserProfileRequest;
import org.moysha.usermanagementmicroservice.dto.user.UserRequest;
import org.moysha.usermanagementmicroservice.dto.user.UserResponse;
import org.moysha.usermanagementmicroservice.dto.user.UserRoleUpdateRequest;
import org.moysha.usermanagementmicroservice.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@Validated
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'moderator')")
    public List<UserResponse> getUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Integer id) {
        return userService.getUser(id);
    }




    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('admin')")
    public UserResponse updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody UserRoleUpdateRequest request
    ) {
        return userService.updateRole(id, request.getRole());
    }



    @PatchMapping("/{id}/profile")
    public UserResponse updateProfile(
            @PathVariable Integer id,
            @Valid @RequestBody UserProfileRequest request
    ) {
        return userService.updateProfile(id, request);
    }

    @PatchMapping("/{id}/ban")
    @PreAuthorize("hasAnyRole('admin', 'moderator')")
    public UserResponse updateBanStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UserBanRequest request
    ) {
        return userService.updateBanStatus(id, request.getBannedTill());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
