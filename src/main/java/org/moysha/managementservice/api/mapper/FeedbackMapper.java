package org.moysha.managementservice.api.mapper;

import org.moysha.managementservice.api.dto.FeedbackDto;
import org.moysha.managementservice.domain.feedback.FeedbackEntity;

public final class FeedbackMapper {

    private FeedbackMapper() {
    }

    public static FeedbackDto toDto(FeedbackEntity entity) {
        if (entity == null) {
            return null;
        }
        return new FeedbackDto(
            entity.getId(),
            entity.getService().getId(),
            entity.getSender().getId(),
            entity.getRate(),
            entity.getReview(),
            entity.getCreatedAt()
        );
    }
}
