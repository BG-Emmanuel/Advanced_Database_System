package com.buy237.model.upload;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "uploads")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Upload {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileUrl;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;
}
