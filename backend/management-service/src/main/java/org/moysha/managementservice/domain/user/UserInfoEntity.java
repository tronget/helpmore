package org.moysha.managementservice.domain.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "user_info")
public class UserInfoEntity {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUserEntity user;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String surname;

    @Column(name = "middle_name", length = 120)
    private String middleName;

    @Lob
    private byte[] avatar;

    @Column(length = 160)
    private String faculty;

    @Column(name = "phone_number", length = 32)
    private String phoneNumber;

    @Column(length = 64, unique = true)
    private String telegram;

    @Column(nullable = false)
    private Double rate = 0.0;
}
