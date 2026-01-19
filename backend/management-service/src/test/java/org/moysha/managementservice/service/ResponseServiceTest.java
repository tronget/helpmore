package org.moysha.managementservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.moysha.managementservice.IntegrationTestBase;
import org.moysha.managementservice.api.dto.ResponseDto;
import org.moysha.managementservice.api.request.CreateResponseRequest;
import org.moysha.managementservice.api.request.CreateServiceRequest;
import org.moysha.managementservice.domain.category.CategoryEntity;
import org.moysha.managementservice.domain.service.ServiceType;
import org.moysha.managementservice.domain.user.AppUserEntity;
import org.moysha.managementservice.exception.BadRequestException;
import org.moysha.managementservice.exception.ConflictException;
import org.moysha.managementservice.repository.AppUserRepository;
import org.moysha.managementservice.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;

class ResponseServiceTest extends IntegrationTestBase {

    @Autowired
    private ResponseService responseService;

    @Autowired
    private ServiceCatalogService serviceCatalogService;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private AppUserEntity owner;
    private AppUserEntity sender;
    private Long serviceId;

    @BeforeEach
    void setUp() {
        owner = persistUser("owner@itmo.ru");
        sender = persistUser("sender@itmo.ru");
        CategoryEntity category = persistCategory("Учеба");
        serviceId = serviceCatalogService.create(new CreateServiceRequest(
            owner.getId(),
            category.getId(),
            "Помощь с лабораторной",
            "Разберем алгоритмы",
            ServiceType.ORDER,
            new BigDecimal("1000.00"),
            false,
            "Онлайн"
        )).getId();
    }

    @Test
    void respondCreatesResponseAndPreventsDuplicate() {
        ResponseDto created = responseService.respond(serviceId, new CreateResponseRequest(sender.getId()));
        assertThat(created.getId()).isNotNull();
        assertThat(created.getSenderId()).isEqualTo(sender.getId());

        assertThrows(ConflictException.class, () ->
            responseService.respond(serviceId, new CreateResponseRequest(sender.getId()))
        );
    }

    @Test
    void ownerCannotRespondToOwnService() {
        assertThrows(BadRequestException.class, () ->
            responseService.respond(serviceId, new CreateResponseRequest(owner.getId()))
        );
    }

    private AppUserEntity persistUser(String email) {
        AppUserEntity user = new AppUserEntity();
        user.setEmail(email);
        user.setToken(email + "-token");
        user.setRole(org.moysha.managementservice.domain.user.UserRole.user);
        return appUserRepository.save(user);
    }

    private CategoryEntity persistCategory(String name) {
        CategoryEntity category = new CategoryEntity();
        category.setName(name);
        return categoryRepository.save(category);
    }
}
