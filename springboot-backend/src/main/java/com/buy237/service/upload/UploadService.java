package com.buy237.service.upload;

import com.buy237.model.upload.Upload;
import com.buy237.repository.upload.UploadRepository;
import com.buy237.dto.upload.UploadResponse;
import com.buy237.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UploadService {
    @Autowired
    private UploadRepository uploadRepository;

    private final String uploadDir = "uploads/";

    public UploadResponse uploadFile(Long userId, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        Files.createDirectories(Paths.get(uploadDir));
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, fileName);
        file.transferTo(filePath);
        String fileUrl = "/" + uploadDir + fileName;
        Upload upload = Upload.builder()
                .userId(userId)
                .fileName(fileName)
                .fileUrl(fileUrl)
                .uploadedAt(LocalDateTime.now())
                .build();
        upload = uploadRepository.save(upload);
        return toUploadResponse(upload);
    }

    public List<UploadResponse> getUploadsByUser(Long userId) {
        return uploadRepository.findByUserId(userId).stream().map(this::toUploadResponse).collect(Collectors.toList());
    }

    public void deleteUpload(Long uploadId) {
        Upload upload = uploadRepository.findById(uploadId).orElseThrow(() -> new ResourceNotFoundException("Upload not found"));
        File file = new File(upload.getFileUrl());
        if (file.exists()) file.delete();
        uploadRepository.deleteById(uploadId);
    }

    private UploadResponse toUploadResponse(Upload upload) {
        UploadResponse resp = new UploadResponse();
        resp.setId(upload.getId());
        resp.setUserId(upload.getUserId());
        resp.setFileName(upload.getFileName());
        resp.setFileUrl(upload.getFileUrl());
        resp.setUploadedAt(upload.getUploadedAt());
        return resp;
    }
}
