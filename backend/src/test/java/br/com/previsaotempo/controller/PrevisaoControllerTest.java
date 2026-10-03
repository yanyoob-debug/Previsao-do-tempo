package br.com.previsaotempo.controller;

import br.com.previsaotempo.exception.GlobalExceptionHandler;
import br.com.previsaotempo.service.PrevisaoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = PrevisaoController.class)
class PrevisaoControllerTest {
 @Autowired MockMvc mvc; @MockBean PrevisaoService service;
 @Test void rejeitaFormasAmbiguasDeConsulta() throws Exception { mvc.perform(get("/api/previsao").param("cidade", "Curitiba").param("latitude", "-25").param("longitude", "-49")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").exists()); }
 @Test void exigeConsulta() throws Exception { mvc.perform(get("/api/previsao")).andExpect(status().isBadRequest()); }
}
