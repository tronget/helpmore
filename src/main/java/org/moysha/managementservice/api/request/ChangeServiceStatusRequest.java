package org.moysha.managementservice.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.moysha.managementservice.domain.service.ServiceStatus;

@Getter
@Setter
public class ChangeServiceStatusRequest {

    @NotNull
    private Long requesterId;

    @NotNull
    private ServiceStatus status;
}
