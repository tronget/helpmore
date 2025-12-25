package org.moysha.managementservice.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.moysha.managementservice.api.dto.ServiceDto;
import org.moysha.managementservice.api.request.ChangeServiceStatusRequest;
import org.moysha.managementservice.service.ServiceCatalogService;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserServiceController {

    private final ServiceCatalogService serviceCatalogService;

    public UserServiceController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @PatchMapping("/{userId}/services/status")
    public List<ServiceDto> changeUserServicesStatus(@PathVariable Long userId,
                                                     @Valid @RequestBody ChangeServiceStatusRequest request) {
        System.err.println("PATCH /api/users/{userId}/services/status");
        return serviceCatalogService.changeUserServicesStatus(userId, request.getStatus(), request.getRequesterId());
    }


}
