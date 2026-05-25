package br.com.baluarte.core.shared.api;

import java.util.List;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApiCorsConfiguration implements WebMvcConfigurer {

    private final List<String> allowedOrigins;
    private final String uploadDir;

    public ApiCorsConfiguration(
        @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}") String allowedOrigins,
        @Value("${app.media.upload-dir:uploads}") String uploadDir
    ) {
        this.allowedOrigins = Stream.of(allowedOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isBlank())
            .toList();
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/v1/media/files/**")
            .addResourceLocations("file:" + uploadDir + "/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.toArray(String[]::new))
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders(
                "Authorization",
                "Content-Type",
                "X-Clerk-User-Id",
                "X-Clerk-Email",
                "X-Internal-Role",
                "X-Admin-Bypass-Key",
                "X-Requested-With"
            )
            .exposedHeaders("X-Trace-Id")
            .allowCredentials(false)
            .maxAge(3600);
    }
}
