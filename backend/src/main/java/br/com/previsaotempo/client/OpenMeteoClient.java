package br.com.previsaotempo.client;

import br.com.previsaotempo.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OpenMeteoClient {
    private final RestClient previsaoClient;
    private final RestClient geocodingClient;
    public OpenMeteoClient(RestClient.Builder builder) {
        previsaoClient = builder.baseUrl("https://api.open-meteo.com").build();
        geocodingClient = builder.baseUrl("https://geocoding-api.open-meteo.com").build();
    }
    public Localizacao buscarPorCidade(String cidade) {
        JsonNode resposta = consultar(geocodingClient, "/v1/search", uri -> uri.queryParam("name", cidade).queryParam("count", 1).queryParam("language", "pt").queryParam("format", "json"));
        JsonNode resultados = resposta.path("results");
        if (!resultados.isArray() || resultados.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Cidade não encontrada. Verifique o nome e tente novamente.");
        JsonNode item = resultados.get(0);
        return new Localizacao(item.path("name").asText(cidade), item.path("country_code").asText(), item.path("admin1").asText(), item.path("latitude").asDouble(), item.path("longitude").asDouble());
    }
    public JsonNode buscarPrevisao(double latitude, double longitude) {
        return consultar(previsaoClient, "/v1/forecast", uri -> uri.queryParam("latitude", latitude).queryParam("longitude", longitude).queryParam("current", "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day").queryParam("hourly", "temperature_2m,weather_code,precipitation_probability").queryParam("daily", "weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max").queryParam("forecast_days", 10).queryParam("timezone", "auto").queryParam("timeformat", "unixtime").queryParam("wind_speed_unit", "kmh"));
    }
    private JsonNode consultar(RestClient client, String caminho, java.util.function.Function<org.springframework.web.util.UriBuilder, org.springframework.web.util.UriBuilder> parametros) {
        try {
            JsonNode corpo = client.get().uri(uri -> parametros.apply(uri.path(caminho)).build()).retrieve().body(JsonNode.class);
            if (corpo == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "A fonte meteorológica retornou uma resposta inválida.");
            return corpo;
        } catch (ApiException e) { throw e; }
        catch (RestClientException e) { throw new ApiException(HttpStatus.BAD_GATEWAY, "A fonte meteorológica está indisponível no momento."); }
    }
    public record Localizacao(String cidade, String pais, String estado, double latitude, double longitude) { }
}
