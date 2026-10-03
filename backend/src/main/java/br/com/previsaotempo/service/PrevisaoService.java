package br.com.previsaotempo.service;

import br.com.previsaotempo.client.OpenMeteoClient;
import br.com.previsaotempo.client.OpenMeteoClient.Localizacao;
import br.com.previsaotempo.dto.*;
import br.com.previsaotempo.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.stream.IntStream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PrevisaoService {
    private final OpenMeteoClient client;
    public PrevisaoService(OpenMeteoClient client) { this.client = client; }
    public PrevisaoResponse buscarPorCidade(String cidade) {
        if (cidade == null || cidade.isBlank()) throw invalida();
        Localizacao local = client.buscarPorCidade(cidade.trim());
        return montar(local, client.buscarPrevisao(local.latitude(), local.longitude()));
    }
    public PrevisaoResponse buscarPorCoordenadas(Double latitude, Double longitude) {
        if (latitude == null || longitude == null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw invalida();
        JsonNode dados = client.buscarPrevisao(latitude, longitude);
        return montar(new Localizacao("Localização atual", "", "", latitude, longitude), dados);
    }
    private PrevisaoResponse montar(Localizacao local, JsonNode dados) {
        JsonNode atual = dados.path("current");
        return new PrevisaoResponse(local.cidade(), local.pais(), local.latitude(), local.longitude(),
            new PrevisaoAtual(atual.path("temperature_2m").asDouble(), atual.path("apparent_temperature").asDouble(), atual.path("relative_humidity_2m").asInt(), atual.path("wind_speed_10m").asDouble(), atual.path("wind_direction_10m").asInt(), condicao(atual.path("weather_code").asInt()), descricao(atual.path("weather_code").asInt()), emoji(atual.path("weather_code").asInt()).replace("d", atual.path("is_day").asInt(1) == 1 ? "d" : "n")),
            horas(dados.path("hourly"), atual.path("time").asLong()), List.of(), dias(dados.path("daily")), dados.path("timezone").asText("UTC"));
    }
    private List<PrevisaoHora> horas(JsonNode horas, long agora) {
        JsonNode tempos = horas.path("time"), temperaturas = horas.path("temperature_2m"), codigos = horas.path("weather_code"), chuvas = horas.path("precipitation_probability");
        return IntStream.range(0, tempos.size()).filter(indice -> tempos.path(indice).asLong() >= agora).limit(24).mapToObj(indice -> { int codigo = codigos.path(indice).asInt(); return new PrevisaoHora(tempos.path(indice).asLong(), temperaturas.path(indice).asDouble(), condicao(codigo), descricao(codigo), emoji(codigo), chuvas.path(indice).asInt()); }).toList();
    }
    private List<PrevisaoDia> dias(JsonNode dias) {
        return IntStream.range(0, dias.path("time").size()).limit(10).mapToObj(i -> {
            int codigo = dias.path("weather_code").path(i).asInt();
            return new PrevisaoDia(dias.path("time").path(i).asLong(), dias.path("temperature_2m_min").path(i).asDouble(), dias.path("temperature_2m_max").path(i).asDouble(), descricao(codigo), emoji(codigo), dias.path("precipitation_probability_max").path(i).asInt());
        }).toList();
    }
    private String condicao(int codigo) { return switch (codigo) { case 0 -> "Clear"; case 1,2,3 -> "Clouds"; case 45,48 -> "Fog"; case 51,53,55,56,57,61,63,65,66,67,80,81,82 -> "Rain"; case 71,73,75,77,85,86 -> "Snow"; case 95,96,99 -> "Thunderstorm"; default -> "Unknown"; }; }
    private String descricao(int codigo) { return switch (codigo) { case 0 -> "céu limpo"; case 1 -> "predominantemente limpo"; case 2 -> "parcialmente nublado"; case 3 -> "nublado"; case 45,48 -> "neblina"; case 51,53,55,56,57 -> "garoa"; case 61,63,65,66,67,80,81,82 -> "chuva"; case 71,73,75,77,85,86 -> "neve"; case 95,96,99 -> "trovoada"; default -> "condição indisponível"; }; }
    private String emoji(int codigo) { return switch (codigo) { case 0 -> "01d"; case 1,2 -> "02d"; case 3 -> "03d"; case 45,48 -> "50d"; case 51,53,55,56,57,61,63,65,66,67,80,81,82 -> "10d"; case 71,73,75,77,85,86 -> "13d"; case 95,96,99 -> "11d"; default -> "01d"; }; }
    private ApiException invalida() { return new ApiException(HttpStatus.BAD_REQUEST, "Informe uma cidade ou coordenadas válidas."); }
}
