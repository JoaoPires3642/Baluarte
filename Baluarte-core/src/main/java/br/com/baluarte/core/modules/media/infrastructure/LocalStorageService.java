package br.com.baluarte.core.modules.media.infrastructure;

import br.com.baluarte.core.modules.media.application.StorageService;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnMissingBean(S3StorageService.class)
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

    private final Path uploadDir;

    public LocalStorageService(@Value("${app.media.upload-dir:uploads}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(uploadDir);
            log.info("LocalStorageService initialized, dir={}", uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    @Override
    public String upload(String filename, InputStream data, long contentLength, String contentType) {
        try {
            Path targetPath = uploadDir.resolve(filename).normalize();
            if (!targetPath.startsWith(uploadDir)) {
                throw new SecurityException("Invalid path: " + filename);
            }
            Files.copy(data, targetPath, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + filename, e);
        }
    }

    @Override
    public InputStream download(String key) {
        try {
            Path filePath = uploadDir.resolve(key).normalize();
            if (!filePath.startsWith(uploadDir)) {
                throw new SecurityException("Invalid path: " + key);
            }
            return Files.newInputStream(filePath);
        } catch (IOException e) {
            throw new RuntimeException("File not found: " + key, e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            Path filePath = uploadDir.resolve(key).normalize();
            if (!filePath.startsWith(uploadDir)) {
                throw new SecurityException("Invalid path: " + key);
            }
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", key, e);
        }
    }

    @Override
    public String getPublicUrl(String key) {
        return "/api/v1/media/files/" + key;
    }
}
