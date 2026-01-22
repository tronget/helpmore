package org.moysha.managementservice.api.controller;

import org.moysha.managementservice.api.dto.FavoriteDto;
import org.moysha.managementservice.service.FavoriteService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping("/favorites")
    public Page<FavoriteDto> getFavorites(@RequestHeader("X-User-Id") Long userId, Pageable pageable) {
        System.err.println("GET /api/favorites");
        return favoriteService.getFavorites(userId, pageable);
    }

    @PostMapping("/services/{serviceId}/favorites")
    public FavoriteDto add(@PathVariable Long serviceId,
                           @RequestHeader("X-User-Id") Long userId) {
        System.err.println("POST /api/services/{serviceId}/favorites");
        return favoriteService.addToFavorites(serviceId, userId);
    }

    @DeleteMapping("/services/{serviceId}/favorites")
    public void remove(@PathVariable Long serviceId,
                       @RequestHeader("X-User-Id") Long userId) {
        System.err.println("DELETE /api/services/{serviceId}/favorites");
        favoriteService.removeFromFavorites(serviceId, userId);
    }
}
