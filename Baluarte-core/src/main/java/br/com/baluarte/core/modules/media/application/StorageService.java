package br.com.baluarte.core.modules.media.application;

import java.io.InputStream;

public interface StorageService {

    String upload(String filename, InputStream data, long contentLength, String contentType);

    InputStream download(String key);

    void delete(String key);

    String getPublicUrl(String key);
}
