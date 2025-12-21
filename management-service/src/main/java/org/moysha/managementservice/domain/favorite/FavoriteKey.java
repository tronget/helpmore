package org.moysha.managementservice.domain.favorite;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class FavoriteKey implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "service_id")
    private Long serviceId;
}
