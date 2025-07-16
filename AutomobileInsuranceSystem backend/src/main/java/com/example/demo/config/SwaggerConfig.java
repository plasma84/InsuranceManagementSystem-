package com.example.demo.config;

/**
 * Swagger Configuration for Automobile Insurance Management System
 * 
 * This configuration sets up OpenAPI 3.0 documentation with JWT authentication support.
 * 
 * Access Points:
 * - Swagger UI: http://localhost:8888/swagger-ui.html
 * - API Docs JSON: http://localhost:8888/v3/api-docs
 * - H2 Database Console: http://localhost:8888/h2-console
 * 
 * Database Connection Details:
 * - JDBC URL: jdbc:h2:mem:testdb
 * - Username: root
 * - Password: (leave blank)
 * 
 * Sample Login Credentials:
 * - Email: john.doe@example.com
 * - Password: TestPassword123!
 */

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    /**
     * Configures OpenAPI 3.0 documentation with JWT Bearer token authentication
     * 
     * Features:
     * - JWT Bearer token security scheme
     * - Global security requirement for all endpoints
     * - Clean API documentation interface
     * 
     * @return OpenAPI configuration bean
     */
    @Bean
    public OpenAPI insuranceOpenAPI() {
        // Define the security scheme name for JWT authentication
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
            // Apply JWT security globally to all API endpoints
            .addSecurityItem(new SecurityRequirement()
                .addList(securitySchemeName))
            // Configure security components and schemes
            .components(new Components()
                .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                    .name(securitySchemeName)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"")
                )
            )
            // Set API metadata information
            .info(new Info().title("Automobile Insurance Management API")
                .version("v2.0.0")
            );
    }
}
