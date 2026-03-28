package br.com.baluarte.core.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationStartupTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldApplyV1FlywayMigrationAtStartup() {
        Integer migrationCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM \"flyway_schema_history\"",
            Integer.class
        );

        assertThat(migrationCount).isNotNull();
        assertThat(migrationCount).isGreaterThan(0);
    }
}
