package org.moysha.usermanagementmicroservice.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "user_info",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_info_telegram", columnNames = "telegram")
        }
)
public class UserInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "user_info_user_id_fkey")
    )
    private AppUser user;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "surname", nullable = false, length = 120)
    private String surname;

    @Column(name = "middle_name", length = 120)
    private String middleName;

    @Column(name = "avatar", columnDefinition = "bytea")
    private byte[] avatar;

    @Column(name = "faculty", length = 160)
    private String faculty;

    @Column(name = "phone_number", length = 32)
    private String phoneNumber;

    @Column(name = "telegram", length = 64)
    private String telegram;

    @Column(name = "rate", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rate = BigDecimal.ZERO;
}
