package org.moysha.managementservice.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateFeedbackRequest {

    @NotNull
    private Long senderId;

    @Min(1)
    @Max(5)
    private short rate;

    @Size(max = 5000)
    private String review;
}
