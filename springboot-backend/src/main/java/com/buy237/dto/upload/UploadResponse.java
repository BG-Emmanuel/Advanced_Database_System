package com.buy237.dto.upload;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UploadResponse {
    private Long id;
    private Long userId;
    private String fileName;
    private String fileUrl;
    private LocalDateTime uploadedAt;
}
