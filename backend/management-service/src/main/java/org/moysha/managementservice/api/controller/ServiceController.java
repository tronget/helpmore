package org.moysha.managementservice.api.controller;

import jakarta.validation.Valid;
import org.moysha.managementservice.api.dto.ServiceDto;
import org.moysha.managementservice.api.request.CreateServiceRequest;
import org.moysha.managementservice.api.request.ServiceSearchRequest;
import org.moysha.managementservice.api.request.ChangeServiceStatusRequest;
import org.moysha.managementservice.api.request.UpdateServiceRequest;
import org.moysha.managementservice.service.ServiceCatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;

    public ServiceController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @PostMapping
    public ServiceDto create(@Valid @RequestBody CreateServiceRequest request) {
        System.err.println("POST /api/services");
        return serviceCatalogService.create(request);
    }

    @PutMapping("/{serviceId}")
    public ServiceDto update(@PathVariable Long serviceId,
                             @Valid @RequestBody UpdateServiceRequest request) {
        System.err.println("PUT /api/services/{serviceId}");
        return serviceCatalogService.update(serviceId, request);
    }

    @GetMapping("/{serviceId}")
    public ServiceDto getById(@PathVariable Long serviceId) {
        System.err.println("GET /api/services/{serviceId}");
        return serviceCatalogService.getById(serviceId);
    }

    @PostMapping("/search")
    public Page<ServiceDto> search(@Valid @RequestBody ServiceSearchRequest request,
                                   Pageable pageable) {
        System.err.println("POST /api/services/search");
        return serviceCatalogService.search(request.toFilter(), pageable);
    }

    @DeleteMapping("/{serviceId}")
    public void delete(@PathVariable Long serviceId,
                       @RequestParam Long requesterId) {
        System.err.println("DELETE /api/services/{serviceId}");
        serviceCatalogService.delete(serviceId, requesterId);
    }

    @PatchMapping("/{serviceId}/status")
    public ServiceDto changeStatus(@PathVariable Long serviceId,
                                   @Valid @RequestBody ChangeServiceStatusRequest request) {
        System.err.println("PATCH /api/services/{serviceId}/status");
        return serviceCatalogService.changeStatus(serviceId, request.getStatus(), request.getRequesterId());
    }
}
