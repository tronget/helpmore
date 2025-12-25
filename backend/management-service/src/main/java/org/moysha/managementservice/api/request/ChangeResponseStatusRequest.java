package org.moysha.managementservice.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.moysha.managementservice.domain.response.ResponseStatus;

@Getter
@Setter
public class ChangeResponseStatusRequest {

    @NotNull
    private Long requesterId;

    @NotNull
    private ResponseStatus status;
}
