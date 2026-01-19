package org.moysha.usermanagementmicroservice.dto.report;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.moysha.usermanagementmicroservice.enums.ReportType;

class ReportCreateRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void requiresMandatoryFields() {
        ReportCreateRequest request = new ReportCreateRequest();

        var violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
    }

    @Test
    void rejectsTooLongTitleAndDescription() {
        ReportCreateRequest request = new ReportCreateRequest(
            10,
            ReportType.spam,
            "t".repeat(256),
            "d".repeat(2049)
        );

        var violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
    }
}
