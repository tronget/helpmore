package org.moysha.usermanagementmicroservice.dto.user;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class UserProfileRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsTooLongFields() {
        UserProfileRequest request = new UserProfileRequest(
            "a".repeat(121),
            "b".repeat(121),
            "c".repeat(121),
            null,
            "d".repeat(161),
            "f".repeat(5001),
            null,
            "e".repeat(65)
        );

        var violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
    }
}
