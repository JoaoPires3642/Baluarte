package br.com.baluarte.core.modules.media.infrastructure;

import br.com.baluarte.core.modules.media.application.StorageService;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Service
@ConditionalOnProperty(name = "app.storage.s3.bucket")
public class S3StorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

    private final S3Client s3Client;
    private final S3Presigner presigner;
    private final String bucket;
    private final Duration presignedUrlTtl;

    public S3StorageService(
        @Value("${app.storage.s3.endpoint}") String endpoint,
        @Value("${app.storage.s3.region}") String region,
        @Value("${app.storage.s3.bucket}") String bucket,
        @Value("${app.storage.s3.access-key-id}") String accessKeyId,
        @Value("${app.storage.s3.secret-access-key}") String secretAccessKey,
        @Value("${app.storage.s3.presigned-url-ttl-minutes}") long ttlMinutes
    ) {
        this.bucket = bucket;
        this.presignedUrlTtl = Duration.ofMinutes(ttlMinutes);

        var credentials = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
        var provider = StaticCredentialsProvider.create(credentials);

        this.s3Client = S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of(region))
            .credentialsProvider(provider)
            .forcePathStyle(false)
            .build();

        this.presigner = S3Presigner.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of(region))
            .credentialsProvider(provider)
            .build();

        log.info("S3StorageService initialized, bucket={}, endpoint={}", bucket, endpoint);
    }

    @Override
    public String upload(String filename, InputStream data, long contentLength, String contentType) {
        s3Client.putObject(PutObjectRequest.builder()
                .bucket(bucket)
                .key(filename)
                .contentLength(contentLength)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .build(),
            software.amazon.awssdk.core.sync.RequestBody.fromInputStream(data, contentLength));

        log.info("Uploaded {} to bucket {}", filename.replaceAll("[\\r\\n]", "_"), bucket);
        return filename;
    }

    @Override
    public InputStream download(String key) {
        return s3Client.getObject(GetObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .build());
    }

    @Override
    public void delete(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .build());
        log.info("Deleted {} from bucket {}", key.replaceAll("[\\r\\n]", "_"), bucket);
    }

    @Override
    public String getPublicUrl(String key) {
        var getObjectRequest = GetObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .build();

        var presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(presignedUrlTtl)
            .getObjectRequest(getObjectRequest)
            .build();

        return presigner.presignGetObject(presignRequest).url().toExternalForm();
    }
}
