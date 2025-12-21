package org.moysha.managementservice.domain.favorite;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.moysha.managementservice.domain.service.ServiceEntity;
import org.moysha.managementservice.domain.user.AppUserEntity;

@Getter
@Setter
@Entity
@Table(name = "favourite_service")
public class FavoriteEntity {

    @EmbeddedId
    private FavoriteKey id = new FavoriteKey();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private AppUserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("serviceId")
    @JoinColumn(name = "service_id")
    private ServiceEntity service;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
