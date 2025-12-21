package org.moysha.managementservice.service;

import org.moysha.managementservice.api.dto.FavoriteDto;
import org.moysha.managementservice.api.mapper.ServiceMapper;
import org.moysha.managementservice.domain.favorite.FavoriteEntity;
import org.moysha.managementservice.domain.favorite.FavoriteKey;
import org.moysha.managementservice.domain.service.ServiceEntity;
import org.moysha.managementservice.domain.user.AppUserEntity;
import org.moysha.managementservice.exception.ConflictException;
import org.moysha.managementservice.exception.NotFoundException;
import org.moysha.managementservice.repository.AppUserRepository;
import org.moysha.managementservice.repository.FavoriteRepository;
import org.moysha.managementservice.repository.ServiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ServiceRepository serviceRepository;
    private final AppUserRepository appUserRepository;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           ServiceRepository serviceRepository,
                           AppUserRepository appUserRepository) {
        this.favoriteRepository = favoriteRepository;
        this.serviceRepository = serviceRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public FavoriteDto addToFavorites(Long serviceId, Long userId) {
        if (favoriteRepository.existsByUser_IdAndService_Id(userId, serviceId)) {
            throw new ConflictException("Service already in favorites");
        }
        AppUserEntity user = appUserRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        ServiceEntity service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new NotFoundException("Service not found: " + serviceId));

        FavoriteEntity entity = new FavoriteEntity();
        entity.setId(new FavoriteKey(user.getId(), service.getId()));
        entity.setUser(user);
        entity.setService(service);

        return toDto(favoriteRepository.save(entity));
    }

    @Transactional
    public void removeFromFavorites(Long serviceId, Long userId) {
        if (!favoriteRepository.existsByUser_IdAndService_Id(userId, serviceId)) {
            throw new NotFoundException("Favorite not found");
        }
        favoriteRepository.deleteByUser_IdAndService_Id(userId, serviceId);
    }

    @Transactional(readOnly = true)
    public Page<FavoriteDto> getFavorites(Long userId, Pageable pageable) {
        return favoriteRepository.findByUser_Id(userId, pageable)
            .map(this::toDto);
    }

    private FavoriteDto toDto(FavoriteEntity entity) {
        return new FavoriteDto(entity.getUser().getId(), ServiceMapper.toDto(entity.getService()), entity.getCreatedAt());
    }
}
