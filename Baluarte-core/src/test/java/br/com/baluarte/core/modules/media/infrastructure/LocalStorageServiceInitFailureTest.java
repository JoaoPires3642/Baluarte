package br.com.baluarte.core.modules.media.infrastructure;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalStorageServiceInitFailureTest {

    @TempDir
    Path tempDir;

    @Test
    void initThrowsWhenCannotCreateDirectory() throws IOException {
        Path file = tempDir.resolve("not-a-dir");
        Files.createFile(file);
        String badPath = file.resolve("subdir").toString();
        LocalStorageService service = new LocalStorageService(badPath);
        assertThatThrownBy(service::init)
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Could not create upload directory");
    }
}
