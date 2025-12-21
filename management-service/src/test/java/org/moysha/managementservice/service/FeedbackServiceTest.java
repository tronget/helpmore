package org.moysha.managementservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.moysha.managementservice.IntegrationTestBase;
import org.moysha.managementservice.api.dto.FeedbackDto;
import org.moysha.managementservice.api.request.CreateFeedbackRequest;
import org.moysha.managementservice.api.request.CreateServiceRequest;
import org.moysha.managementservice.api.request.UpdateFeedbackRequest;
import org.moysha.managementservice.domain.category.CategoryEntity;
import org.moysha.managementservice.domain.service.ServiceType;
import org.moysha.managementservice.domain.user.AppUserEntity;
import org.moysha.managementservice.exception.BadRequestException;
import org.moysha.managementservice.exception.ConflictException;
import org.moysha.managementservice.repository.AppUserRepository;
import org.moysha.managementservice.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;

class FeedbackServiceTest extends IntegrationTestBase {

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private ServiceCatalogService serviceCatalogService;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private AppUserEntity owner;
    private AppUserEntity reviewer;
    private Long serviceId;

    @BeforeEach
    void setUp() {
        System.out.println("Preparing test data for FeedbackServiceTest");
        owner = persistUser("owner@itmo.ru");
        reviewer = persistUser("reviewer@itmo.ru");
        CategoryEntity category = persistCategory("IT-консультации");

        serviceId = serviceCatalogService.create(new CreateServiceRequest(
            owner.getId(),
            category.getId(),
            "Настройка Docker",
            "Помогу выстроить CI",
            ServiceType.OFFER,
            new BigDecimal("2000.00"),
            false,
            "Онлайн"
        )).getId();
    }

    @Test
    void createFeedbackAndPreventDuplicates() {
        FeedbackDto feedback = feedbackService.create(serviceId, new CreateFeedbackRequest(
            reviewer.getId(),
            (short) 5,
            "Все отлично"
        ));

        assertThat(feedback.getId()).isNotNull();
        assertThat(feedback.getRate()).isEqualTo((short) 5);

        assertThrows(ConflictException.class, () ->
            feedbackService.create(serviceId, new CreateFeedbackRequest(
                reviewer.getId(),
                (short) 4,
                "дубль"
            ))
        );
    }

    @Test
    void ownerCannotLeaveFeedbackOnOwnService() {
        assertThrows(BadRequestException.class, () ->
            feedbackService.create(serviceId, new CreateFeedbackRequest(
                owner.getId(),
                (short) 5,
                "сам себе отзыв"
            ))
        );
    }

    @Test
    void updateFeedbackByAuthor() {
        FeedbackDto feedback = feedbackService.create(serviceId, new CreateFeedbackRequest(
            reviewer.getId(),
            (short) 4,
            "Хорошо"
        ));

        FeedbackDto updated = feedbackService.update(
            feedback.getId(),
            new UpdateFeedbackRequest(
                reviewer.getId(),
                (short) 3,
                "Были задержки"
            )
        );

        assertThat(updated.getRate()).isEqualTo((short) 3);
        assertThat(updated.getReview()).contains("задержки");
    }

    private AppUserEntity persistUser(String email) {
        AppUserEntity user = new AppUserEntity();
        user.setEmail(email);
        user.setToken(email + "-token");
        user.setRole(org.moysha.managementservice.domain.user.UserRole.USER);
        return appUserRepository.save(user);
    }

    private CategoryEntity persistCategory(String name) {
        CategoryEntity category = new CategoryEntity();
        category.setName(name);
        return categoryRepository.save(category);
    }
}
