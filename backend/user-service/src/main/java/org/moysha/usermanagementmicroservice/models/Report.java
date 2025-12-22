package org.moysha.usermanagementmicroservice.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.moysha.usermanagementmicroservice.enums.ReportType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "report")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private AppUser reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "reported_user_id",
            nullable = false
    )
    private AppUser reportedUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private ReportType type;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", length = 2048)
    private String description;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
