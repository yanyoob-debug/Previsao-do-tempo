package br.com.previsaotempo.service;

import br.com.previsaotempo.client.OpenMeteoClient;
import br.com.previsaotempo.dto.PrevisaoResponse;
import br.com.previsaotempo.exception.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrevisaoServiceTest {
 @Mock OpenMeteoClient client;
 @InjectMocks PrevisaoService service;
 @Test void transformaDadosDaApi() throws Exception {
  String json = "{\"utc_offset_seconds\":0,\"current\":{\"temperature_2m\":22.4,\"apparent_temperature\":23.1,\"relative_humidity_2m\":68,\"wind_speed_10m\":12.6,\"wind_direction_10m\":135,\"weather_code\":3},\"hourly\":{\"time\":[1000],\"temperature_2m\":[21],\"weather_code\":[3],\"precipitation_probability\":[10]}}";
  when(client.buscarPorCidade("Curitiba")).thenReturn(new OpenMeteoClient.Localizacao("Curitiba", "BR", "PR", -25.4, -49.2));
  when(client.buscarPrevisao(-25.4, -49.2)).thenReturn(new ObjectMapper().readTree(json));
  PrevisaoResponse resposta = service.buscarPorCidade("Curitiba");
  assertEquals("Curitiba", resposta.cidade()); assertEquals(12.6, resposta.atual().vento(), .01); assertEquals(10, resposta.previsaoHoraria().get(0).probabilidadeChuva());
 }
 @Test void rejeitaCoordenadaInvalida() { assertThrows(ApiException.class, () -> service.buscarPorCoordenadas(91d, 0d)); }
 @Test void preservaInstantesFiltraHorasPassadasEIncluiDiasENoite() throws Exception {
  String json = """
   {"timezone":"America/Sao_Paulo","utc_offset_seconds":-10800,
    "current":{"time":2000,"weather_code":0,"is_day":0},
    "hourly":{"time":[1000,3000],"temperature_2m":[18,20],"weather_code":[0,61],"precipitation_probability":[0,75]},
    "daily":{"time":[1000,87400],"temperature_2m_min":[12,13],"temperature_2m_max":[25,26],"weather_code":[0,61],"precipitation_probability_max":[5,80]}}
   """;
  when(client.buscarPrevisao(-25d, -49d)).thenReturn(new ObjectMapper().readTree(json));
  PrevisaoResponse resposta = service.buscarPorCoordenadas(-25d, -49d);
  assertEquals("01n", resposta.atual().icone());
  assertEquals("America/Sao_Paulo", resposta.fusoHorario());
  assertEquals(1, resposta.previsaoHoraria().size());
  assertEquals(3000, resposta.previsaoHoraria().get(0).dataHora());
  assertEquals(2, resposta.previsaoDiaria().size());
  assertEquals(1000, resposta.previsaoDiaria().get(0).data());
  assertEquals(12, resposta.previsaoDiaria().get(0).minima());
  assertEquals(26, resposta.previsaoDiaria().get(1).maxima());
  assertEquals(80, resposta.previsaoDiaria().get(1).probabilidadeChuva());
  assertEquals("10d", resposta.previsaoDiaria().get(1).icone());
 }
}
