package org.moysha.usermanagementmicroservice.services;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.moysha.usermanagementmicroservice.dto.user.UserProfileRequest;
import org.moysha.usermanagementmicroservice.dto.user.UserProfileResponse;
import org.moysha.usermanagementmicroservice.dto.user.UserRequest;
import org.moysha.usermanagementmicroservice.dto.user.UserResponse;
import org.moysha.usermanagementmicroservice.enums.UserRole;
import org.moysha.usermanagementmicroservice.models.AppUser;
import org.moysha.usermanagementmicroservice.models.UserInfo;
import org.moysha.usermanagementmicroservice.repositories.UserInfoRepository;
import org.moysha.usermanagementmicroservice.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserInfoRepository userInfoRepository;

    public List<UserResponse> getAllUsers() {
        List<AppUser> users = userRepository.findAll();
        Map<Integer, UserInfo> profiles = aggregateProfiles(users);
        return users.stream()
                .map(user -> toResponse(user, profiles.get(user.getId())))
                .toList();
    }

    public UserResponse getUser(Integer id) {
        AppUser user = findUser(id);
        UserInfo profile = userInfoRepository.findByUserId(id).orElse(null);
        return toResponse(user, profile);
    }


    @Transactional
    public UserResponse updateRole(Integer id, UserRole role) {
        AppUser user = findUser(id);
        user.setRole(role);
        userRepository.save(user);
        UserInfo profile = userInfoRepository.findByUserId(id).orElse(null);
        return toResponse(user, profile);
    }

    @Transactional
    public UserResponse updateProfile(Integer id, UserProfileRequest profileRequest) {
        AppUser user = findUser(id);
        UserInfo profile = userInfoRepository.findByUserId(id)
                .orElseGet(() -> buildProfile(user, profileRequest));
        applyProfile(profile, profileRequest);
        userInfoRepository.save(profile);
        return toResponse(user, profile);
    }

    @Transactional
    public UserResponse updateBanStatus(Integer id, OffsetDateTime bannedTill) {
        AppUser user = findUser(id);
        user.setBannedTill(bannedTill);
        user.setToken("Banned");
        userRepository.save(user);
        UserInfo profile = userInfoRepository.findByUserId(id).orElse(null);
        return toResponse(user, profile);
    }

    @Transactional
    public void deleteUser(Integer id) {
        AppUser user = findUser(id);
        userInfoRepository.deleteByUserId(user.getId());
        userRepository.delete(user);
    }

    private AppUser findUser(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User %d not found".formatted(id)));
    }

    private Map<Integer, UserInfo> aggregateProfiles(Collection<AppUser> users) {
        if (users.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Integer> ids = users.stream()
                .map(AppUser::getId)
                .toList();

        return userInfoRepository.findByUserIdIn(ids).stream()
                .collect(Collectors.toMap(userInfo -> userInfo.getUser().getId(), Function.identity()));
    }

    private UserInfo buildProfile(AppUser user, UserProfileRequest request) {
        return UserInfo.builder()
                .user(user)
                .name(request.getName())
                .surname(request.getSurname())
                .middleName(request.getMiddleName())
                .avatar(request.getAvatar())
                .faculty(request.getFaculty())
                .phoneNumber(request.getPhoneNumber())
                .telegram(request.getTelegram())
                .build();
    }

    private void applyProfile(UserInfo profile, UserProfileRequest request) {
        profile.setName(request.getName());
        profile.setSurname(request.getSurname());
        profile.setMiddleName(request.getMiddleName());
        profile.setAvatar(request.getAvatar());
        profile.setFaculty(request.getFaculty());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setTelegram(request.getTelegram());
    }

    private UserResponse toResponse(AppUser user, UserInfo profile) {
        UserProfileResponse profileResponse = null;
        if (profile != null) {
            profileResponse = new UserProfileResponse(
                    profile.getName(),
                    profile.getSurname(),
                    profile.getMiddleName(),
                    profile.getAvatar(),
                    profile.getFaculty(),
                    profile.getPhoneNumber(),
                    profile.getTelegram(),
                    profile.getRate()
            );
        }

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getBannedTill(),
                user.getCreatedAt(),
                profileResponse
        );
    }
}
