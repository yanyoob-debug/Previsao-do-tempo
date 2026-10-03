package br.com.previsaotempo.controller;

import br.com.previsaotempo.dto.PrevisaoResponse;
import br.com.previsaotempo.exception.ApiException;
import br.com.previsaotempo.service.PrevisaoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/previsao")
public class PrevisaoController {
    private final PrevisaoService service;
    public PrevisaoController(PrevisaoService service) { this.service = service; }
    @GetMapping
    public PrevisaoResponse buscar(@RequestParam(required=false) String cidade, @RequestParam(required=false) Double latitude, @RequestParam(required=false) Double longitude) {
        boolean porCidade = cidade != null && !cidade.isBlank(); boolean porCoordenadas = latitude != null || longitude != null;
        if (porCidade == porCoordenadas || (porCoordenadas && (latitude == null || longitude == null))) throw new ApiException(HttpStatus.BAD_REQUEST, "Informe apenas uma cidade ou latitude e longitude.");
        return porCidade ? service.buscarPorCidade(cidade) : service.buscarPorCoordenadas(latitude, longitude);
    }
}
