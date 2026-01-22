package org.moysha.managementservice.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.moysha.managementservice.IntegrationTestBase;
import org.moysha.managementservice.api.dto.ServiceDto;
import org.moysha.managementservice.api.request.CreateServiceRequest;
import org.moysha.managementservice.api.request.UpdateServiceRequest;
import org.moysha.managementservice.domain.category.CategoryEntity;
import org.moysha.managementservice.domain.service.ServiceStatus;
import org.moysha.managementservice.domain.service.ServiceType;
import org.moysha.managementservice.domain.user.AppUserEntity;
import org.moysha.managementservice.repository.AppUserRepository;
import org.moysha.managementservice.repository.CategoryRepository;
import org.moysha.managementservice.service.dto.ServiceFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

class ServiceCatalogServiceTest extends IntegrationTestBase {

    @Autowired
    private ServiceCatalogService serviceCatalogService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    private AppUserEntity owner;
    private CategoryEntity studyCategory;
    private CategoryEntity careerCategory;

    @BeforeEach
    void setUp() {
        owner = createUser("owner@example.com");
        studyCategory = createCategory("Учебные");
        careerCategory = createCategory("Карьера");
    }

    @Test
    void createAndSearchServices() {
        CreateServiceRequest createRequest = new CreateServiceRequest(
            owner.getId(),
            studyCategory.getId(),
            "Помощь с Java",
            "Разберем Spring Boot",
            ServiceType.OFFER,
            new BigDecimal("1500.00"),
            false,
            "ИТМО"
        );

        ServiceDto created = serviceCatalogService.create(createRequest);
        assertThat(created.getId()).isNotNull();
        assertThat(created.getCategoryName()).isEqualTo("Учебные");

        ServiceFilter filter = new ServiceFilter(
            owner.getId(),
            studyCategory.getId(),
            ServiceType.OFFER,
            ServiceStatus.ACTIVE,
            null,
            new BigDecimal("1000"),
            new BigDecimal("2000"),
            null,
            null,
            null
        );

        Page<ServiceDto> page = serviceCatalogService.search(filter, PageRequest.of(0, 5));
        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).getTitle()).isEqualTo("Помощь с Java");
    }

    @Test
    void updateAllowsChangingCategoryAndPrice() {
        ServiceDto created = serviceCatalogService.create(new CreateServiceRequest(
            owner.getId(),
            studyCategory.getId(),
            "Подготовка к собеседованию",
            "Пройдем mock-интервью",
            ServiceType.OFFER,
            new BigDecimal("2500.00"),
            false,
            "Онлайн"
        ));

        UpdateServiceRequest request = new UpdateServiceRequest(
            owner.getId(),
            careerCategory.getId(),
            "Mock интервью",
            null,
            new BigDecimal("3000.00"),
            null,
            null
        );

        ServiceDto updated = serviceCatalogService.update(created.getId(), request);
        assertThat(updated.getCategoryId()).isEqualTo(careerCategory.getId());
        assertThat(updated.getPrice()).isEqualByComparingTo("3000.00");
        assertThat(updated.getTitle()).isEqualTo("Mock интервью");
    }

    @Test
    void deleteRemovesServiceForOwner() {
        ServiceDto created = serviceCatalogService.create(new CreateServiceRequest(
            owner.getId(),
            studyCategory.getId(),
            "Разбор контрольной",
            "Проверю и объясню",
            ServiceType.OFFER,
            new BigDecimal("900.00"),
            false,
            "ИТМО"
        ));

        serviceCatalogService.delete(created.getId(), owner.getId());

        Page<ServiceDto> page = serviceCatalogService.search(new ServiceFilter(
            owner.getId(),
            studyCategory.getId(),
            ServiceType.OFFER,
            ServiceStatus.ACTIVE,
            null,
            null,
            null,
            null,
            null,
            null
        ), PageRequest.of(0, 5));
        assertThat(page.getContent())
            .noneMatch(service -> service.getId().equals(created.getId()));
    }

    @Test
    void deleteRequiresOwner() {
        AppUserEntity anotherUser = createUser("other@example.com");
        ServiceDto created = serviceCatalogService.create(new CreateServiceRequest(
            owner.getId(),
            studyCategory.getId(),
            "Помощь с тестами",
            "Подготовлю вопросы",
            ServiceType.OFFER,
            new BigDecimal("1100.00"),
            false,
            "Онлайн"
        ));

        org.junit.jupiter.api.Assertions.assertThrows(
            org.moysha.managementservice.exception.BadRequestException.class,
            () -> serviceCatalogService.delete(created.getId(), anotherUser.getId())
        );
    }

    private AppUserEntity createUser(String email) {
        AppUserEntity user = new AppUserEntity();
        user.setEmail(email);
        user.setToken(email + "-token");
        user.setRole(org.moysha.managementservice.domain.user.UserRole.user);
        return appUserRepository.save(user);
    }

    private CategoryEntity createCategory(String name) {
        CategoryEntity category = new CategoryEntity();
        category.setName(name);
        return categoryRepository.save(category);
    }
}
