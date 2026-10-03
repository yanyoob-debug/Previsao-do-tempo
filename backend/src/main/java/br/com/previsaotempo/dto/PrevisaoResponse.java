package br.com.previsaotempo.dto;
import java.util.List;
public record PrevisaoResponse(String cidade, String pais, double latitude, double longitude, PrevisaoAtual atual, List<PrevisaoHora> previsaoHoraria, List<AvisoMeteorologico> avisos, List<PrevisaoDia> previsaoDiaria, String fusoHorario) { }
