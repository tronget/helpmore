package org.moysha.managementservice.domain.message;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.moysha.managementservice.domain.response.ResponseEntity;
import org.moysha.managementservice.domain.user.AppUserEntity;

@Getter
@Setter
@Entity
@Table(name = "message")
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    private ResponseEntity response;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private AppUserEntity sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private AppUserEntity receiver;

    @Column(name = "message_text", length = 5000)
    private String messageText;

    @Lob
    @Column(name = "message_image")
    private byte[] messageImage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
