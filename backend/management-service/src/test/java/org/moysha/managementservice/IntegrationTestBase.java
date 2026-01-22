package org.moysha.managementservice;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
public abstract class IntegrationTestBase {

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.jpa.properties.hibernate.type.preferred_enum_jdbc_type", () -> "NAMED_ENUM");
        registry.add("spring.jpa.properties.hibernate.jdbc.use_native_enum_types", () -> "true");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void resetDatabase() {
        jdbcTemplate.execute(
            "TRUNCATE TABLE event_publication, message, response, favourite_service, feedback, report, bug_report, service, category, user_info, app_user RESTART IDENTITY CASCADE"
        );
        System.out.println("Database reset via truncate");
    }
}
