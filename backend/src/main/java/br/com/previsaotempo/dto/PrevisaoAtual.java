package br.com.previsaotempo.dto;
public record PrevisaoAtual(double temperatura, double sensacaoTermica, int umidade, double vento, int direcaoVento, String condicao, String descricao, String icone) { }
