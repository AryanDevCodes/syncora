package com.syncora.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    public OpenAPI customOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Syncora API").
                description("Syncora description").
                version("1.0")
                );
    }
}
