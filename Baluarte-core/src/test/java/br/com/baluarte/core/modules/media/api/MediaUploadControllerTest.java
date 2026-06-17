package br.com.baluarte.core.modules.media.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.media.application.StorageService;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class MediaUploadControllerTest {

    @Mock
    private StorageService storageService;

    @InjectMocks
    private MediaUploadController controller;

    @Test
    void uploadsFileWithExtension() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("photo.png");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("data".getBytes()));
        when(file.getSize()).thenReturn(4L);
        when(file.getContentType()).thenReturn("image/png");
        when(storageService.upload(anyString(), any(), anyLong(), anyString()))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(storageService.getPublicUrl(anyString()))
            .thenAnswer(invocation -> "/api/v1/media/files/" + invocation.getArgument(0));

        ApiSuccessResponse<UploadResponse> result = controller.upload(file);

        assertThat(result.data()).isNotNull();
        assertThat(result.data().url()).startsWith("/api/v1/media/files/");
        assertThat(result.data().filename()).endsWith(".png");
        assertThat(result.data().filename()).contains("-");
        verify(storageService).upload(anyString(), any(), eq(4L), eq("image/png"));
        verify(storageService).getPublicUrl(anyString());
    }

    @Test
    void uploadsFileWithoutExtension() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("photo");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("data".getBytes()));
        when(file.getSize()).thenReturn(4L);
        when(file.getContentType()).thenReturn("image/png");
        when(storageService.upload(anyString(), any(), anyLong(), anyString()))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(storageService.getPublicUrl(anyString()))
            .thenAnswer(invocation -> "/api/v1/media/files/" + invocation.getArgument(0));

        ApiSuccessResponse<UploadResponse> result = controller.upload(file);

        assertThat(result.data().filename()).doesNotContain(".");
    }

    @Test
    void uploadsFileWithNullOriginalName() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn(null);
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("data".getBytes()));
        when(file.getSize()).thenReturn(4L);
        when(file.getContentType()).thenReturn("image/png");
        when(storageService.upload(anyString(), any(), anyLong(), anyString()))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(storageService.getPublicUrl(anyString()))
            .thenAnswer(invocation -> "/api/v1/media/files/" + invocation.getArgument(0));

        ApiSuccessResponse<UploadResponse> result = controller.upload(file);

        assertThat(result.data().filename()).doesNotContain(".");
    }

    @Test
    void throwsBadRequestWhenFileIsEmpty() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        assertThatThrownBy(() -> controller.upload(file))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST)
            .hasMessageContaining("Arquivo vazio");
    }

    @Test
    void throwsInternalServerErrorWhenGetInputStreamFails() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("photo.png");
        when(file.getInputStream()).thenThrow(new IOException("stream failed"));

        assertThatThrownBy(() -> controller.upload(file))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("status", HttpStatus.INTERNAL_SERVER_ERROR)
            .hasMessageContaining("Erro ao processar arquivo");
    }
}
