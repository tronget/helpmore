package org.moysha.managementservice.api.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDto {

    private Long id;
    private Long serviceId;
    private Long senderId;
    private short rate;
    private String review;
    private Instant createdAt;
}
