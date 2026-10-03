package br.com.previsaotempo.exception;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
@RestControllerAdvice
public class GlobalExceptionHandler {
 @ExceptionHandler(ApiException.class) ResponseEntity<Map<String,String>> tratarApi(ApiException e) { return ResponseEntity.status(e.getStatus()).body(Map.of("mensagem", e.getMessage())); }
 @ExceptionHandler(Exception.class) ResponseEntity<Map<String,String>> tratarInesperado(Exception e) { return ResponseEntity.internalServerError().body(Map.of("mensagem", "Não foi possível obter a previsão agora. Tente novamente.")); }
}
