package com.buy237.repository.upload;

import com.buy237.model.upload.Upload;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UploadRepository extends JpaRepository<Upload, Long> {
    List<Upload> findByUserId(Long userId);
}
