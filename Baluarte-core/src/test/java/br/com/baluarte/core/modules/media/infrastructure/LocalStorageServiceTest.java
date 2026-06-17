package br.com.baluarte.core.modules.media.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalStorageServiceTest {

    @TempDir
    Path tempDir;

    private LocalStorageService service;

    @BeforeEach
    void setUp() {
        service = new LocalStorageService(tempDir.toString());
        service.init();
    }

    @AfterEach
    void tearDown() throws IOException {
        try (var files = Files.walk(tempDir)) {
            files.sorted(Comparator.reverseOrder())
                .forEach(file -> {
                    try {
                        Files.deleteIfExists(file);
                    } catch (IOException ignored) {
                    }
                });
        }
    }

    @Test
    void uploadSavesFileAndReturnsFilename() throws IOException {
        byte[] content = "file-content".getBytes();

        String filename = service.upload(
            "test.txt",
            new ByteArrayInputStream(content),
            content.length,
            "text/plain"
        );

        assertThat(filename).isEqualTo("test.txt");
        assertThat(Files.readAllBytes(tempDir.resolve("test.txt"))).isEqualTo(content);
    }

    @Test
    void downloadReturnsSavedContent() throws IOException {
        Files.writeString(tempDir.resolve("hello.txt"), "hello-world");

        try (InputStream input = service.download("hello.txt")) {
            byte[] bytes = input.readAllBytes();
            assertThat(new String(bytes)).isEqualTo("hello-world");
        }
    }

    @Test
    void downloadThrowsWhenFileNotFound() {
        assertThatThrownBy(() -> service.download("nonexistent.txt"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("File not found");
    }

    @Test
    void deleteRemovesFile() throws IOException {
        Files.createFile(tempDir.resolve("temp.txt"));
        assertThat(Files.exists(tempDir.resolve("temp.txt"))).isTrue();

        service.delete("temp.txt");

        assertThat(Files.exists(tempDir.resolve("temp.txt"))).isFalse();
    }

    @Test
    void deleteDoesNotThrowWhenFileDoesNotExist() {
        service.delete("ghost.txt");
    }

    @Test
    void uploadRejectsPathTraversal() {
        assertThatThrownBy(() -> service.upload(
            "../secret.txt",
            new ByteArrayInputStream("hack".getBytes()),
            4,
            "text/plain"
        ))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("Invalid path");
    }

    @Test
    void uploadRejectsAbsolutePathTraversal() {
        assertThatThrownBy(() -> service.upload(
            "/etc/passwd",
            new ByteArrayInputStream("hack".getBytes()),
            4,
            "text/plain"
        ))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("Invalid path");
    }

    @Test
    void downloadRejectsPathTraversal() {
        assertThatThrownBy(() -> service.download("../secret.txt"))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("Invalid path");
    }

    @Test
    void deleteRejectsPathTraversal() {
        assertThatThrownBy(() -> service.delete("../secret.txt"))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("Invalid path");
    }

    @Test
    void getPublicUrlReturnsExpectedFormat() {
        String url = service.getPublicUrl("files/photo.png");

        assertThat(url).isEqualTo("/api/v1/media/files/files/photo.png");
    }

    @Test
    void overwritesExistingFileOnUpload() throws IOException {
        Files.writeString(tempDir.resolve("existing.txt"), "old-content");

        service.upload(
            "existing.txt",
            new ByteArrayInputStream("new-content".getBytes()),
            11,
            "text/plain"
        );

        assertThat(Files.readString(tempDir.resolve("existing.txt")))
            .isEqualTo("new-content");
    }
}
