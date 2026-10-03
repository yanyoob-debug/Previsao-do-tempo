package br.com.previsaotempo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PrevisaoTempoApplication {
    public static void main(String[] args) { SpringApplication.run(PrevisaoTempoApplication.class, args); }
}
