package org.moysha.usermanagementmicroservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.user.*;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
import org.springframework.web.server.ResponseStatusException;

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
        System.err.println("Request: GET /users");
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Integer id) {
        System.err.println("Request: GET /users/" + id);
        return userService.getUser(id);
    }

    @GetMapping("/me")
    public UserMeResponse getCurrentUser(Authentication authentication) {
        System.err.println("Request: GET /users/me");
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return userService.getCurrentUser(user);
    }




    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('admin')")
    public UserResponse updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody UserRoleUpdateRequest request
    ) {
        System.err.println("Request: PATCH /users/" + id + "/role");
        return userService.updateRole(id, request.getRole());
    }



    @PatchMapping("/{id}/profile")
    public UserResponse updateProfile(
            @PathVariable Integer id,
            @Valid @RequestBody UserProfileRequest request
    ) {
        System.err.println("Request: PATCH /users/" + id + "/profile");
        return userService.updateProfile(id, request);
    }

    @PatchMapping("/{id}/ban")
    @PreAuthorize("hasAnyRole('admin', 'moderator')")
    public UserResponse updateBanStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UserBanRequest request
    ) {
        System.err.println("Request: PATCH /users/" + id + "/ban");
        return userService.updateBanStatus(id, request.getBannedTill());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        System.err.println("Request: DELETE /users/" + id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

//    @PostMapping("/rate")
//    public ResponseEntity<Void> addMark(
//            @Valid @RequestBody UserUpdateRateRequest addMark
//    ) {
//        System.err.println("Request: POST /users/rate");
//        userService.userUpdateRate(addMark);
//        return ResponseEntity.ok().build();
//    }


}
