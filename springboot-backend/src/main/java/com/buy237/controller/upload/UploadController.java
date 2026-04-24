package com.buy237.controller.upload;

import com.buy237.dto.upload.UploadResponse;
import com.buy237.service.upload.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {
    @Autowired
    private UploadService uploadService;

    // For demo, userId is passed as a query param. In production, extract from JWT.
    @PostMapping
    public ResponseEntity<UploadResponse> uploadFile(@RequestParam Long userId, @RequestParam("file") MultipartFile file) throws IOException {
        UploadResponse response = uploadService.uploadFile(userId, file);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<UploadResponse>> getUploadsByUser(@RequestParam Long userId) {
        List<UploadResponse> uploads = uploadService.getUploadsByUser(userId);
        return ResponseEntity.ok(uploads);
    }

    @DeleteMapping("/{uploadId}")
    public ResponseEntity<Void> deleteUpload(@PathVariable Long uploadId) {
        uploadService.deleteUpload(uploadId);
        return ResponseEntity.noContent().build();
    }
}
