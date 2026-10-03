package br.com.previsaotempo.dto;
public record PrevisaoHora(long dataHora, double temperatura, String condicao, String descricao, String icone, int probabilidadeChuva) { }
