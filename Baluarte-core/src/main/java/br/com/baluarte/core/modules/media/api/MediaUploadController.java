package br.com.baluarte.core.modules.media.api;

import br.com.baluarte.core.modules.media.application.StorageService;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/media")
public class MediaUploadController {

    private final StorageService storageService;

    public MediaUploadController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ApiSuccessResponse<UploadResponse> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio");
        }

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }

        String filename = UUID.randomUUID().toString() + extension;

        try {
            String key = storageService.upload(filename, file.getInputStream(), file.getSize(), file.getContentType());
            String url = storageService.getPublicUrl(key);
            return ApiSuccessResponse.of(new UploadResponse(url, key));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao processar arquivo");
        }
    }
}

record UploadResponse(String url, String filename) {}
