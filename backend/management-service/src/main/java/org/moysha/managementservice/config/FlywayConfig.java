package org.moysha.managementservice.config;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FlywaySettings.class)
public class FlywayConfig {

    @Bean
    public Flyway flyway(DataSource dataSource, FlywaySettings settings) {
        FluentConfiguration configuration = Flyway.configure()
            .dataSource(dataSource);
        if (settings.getSchema() != null) {
            configuration.schemas(settings.getSchema());
        }
        if (settings.getLocations() != null && !settings.getLocations().isEmpty()) {
            configuration.locations(settings.getLocations().toArray(String[]::new));
        }
        return configuration.load();
    }
}
