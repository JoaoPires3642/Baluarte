package br.com.baluarte.core.modules.media.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.media.application.StorageService;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class MediaFileControllerTest {

    @Mock
    private StorageService storageService;

    @InjectMocks
    private MediaFileController controller;

    @Test
    void returnsPngWithCorrectContentType() throws IOException {
        byte[] content = "png-data".getBytes();
        when(storageService.download("image.png")).thenReturn(new ByteArrayInputStream(content));

        ResponseEntity<byte[]> response = controller.getFile("image.png");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/png");
        assertThat(response.getBody()).isEqualTo(content);
    }

    @Test
    void returnsJpegWithCorrectContentType() throws IOException {
        byte[] content = "jpg-data".getBytes();
        when(storageService.download("photo.jpg")).thenReturn(new ByteArrayInputStream(content));

        ResponseEntity<byte[]> response = controller.getFile("photo.jpg");

        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/jpeg");
        assertThat(response.getBody()).isEqualTo(content);
    }

    @Test
    void returnsJpegForJpegExtension() throws IOException {
        byte[] content = "jpeg-data".getBytes();
        when(storageService.download("photo.jpeg")).thenReturn(new ByteArrayInputStream(content));

        ResponseEntity<byte[]> response = controller.getFile("photo.jpeg");

        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/jpeg");
        assertThat(response.getBody()).isEqualTo(content);
    }

    @Test
    void returnsGifWithCorrectContentType() throws IOException {
        byte[] content = "gif-data".getBytes();
        when(storageService.download("anim.gif")).thenReturn(new ByteArrayInputStream(content));

        ResponseEntity<byte[]> response = controller.getFile("anim.gif");

        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/gif");
        assertThat(response.getBody()).isEqualTo(content);
    }

    @Test
    void returnsWebpWithCorrectContentType() throws IOException {
        byte[] content = "webp-data".getBytes();
        when(storageService.download("image.webp")).thenReturn(new ByteArrayInputStream(content));

        ResponseEntity<byte[]> response = controller.getFile("image.webp");

        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/webp");
        assertThat(response.getBody()).isEqualTo(content);
    }

    @Test
    void returnsSvgWithCorrectContentType() throws IOException {
        byte[] content = "<svg/>".getBytes();
        when(storageService.download("icon.svg")).thenReturn(new ByteArrayInputStream(content));

        ResponseEntity<byte[]> response = controller.getFile("icon.svg");

        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/svg+xml");
        assertThat(response.getBody()).isEqualTo(content);
    }

    @Test
    void returnsOctetStreamForUnknownExtension() throws IOException {
        byte[] content = "binary-data".getBytes();
        when(storageService.download("file.bin")).thenReturn(new ByteArrayInputStream(content));

        ResponseEntity<byte[]> response = controller.getFile("file.bin");

        assertThat(response.getHeaders().getContentType().toString())
            .isEqualTo("application/octet-stream");
        assertThat(response.getBody()).isEqualTo(content);
    }

    @Test
    void guessContentTypeIsCaseInsensitive() throws IOException {
        byte[] content = "data".getBytes();
        when(storageService.download("image.PNG")).thenReturn(new ByteArrayInputStream(content));

        ResponseEntity<byte[]> response = controller.getFile("image.PNG");

        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/png");
    }

    @Test
    void throwsNotFoundWhenReadAllBytesFails() throws IOException {
        InputStream broken = mock(InputStream.class);
        when(broken.readAllBytes()).thenThrow(new IOException("disk error"));

        when(storageService.download("broken.png")).thenReturn(broken);

        assertThatThrownBy(() -> controller.getFile("broken.png"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Arquivo nao encontrado");
    }

    @Test
    void throwsNotFoundWhenInputStreamCloseFails() throws IOException {
        InputStream broken = mock(InputStream.class);
        when(broken.readAllBytes()).thenReturn(new byte[0]);
        doThrow(new IOException("close error")).when(broken).close();

        when(storageService.download("close-fail.png")).thenReturn(broken);

        assertThatThrownBy(() -> controller.getFile("close-fail.png"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }
}
