# Previsão do Tempo

Aplicação web de portfólio com condições atuais, previsão por hora e previsão para 10 dias. A interface é responsiva, com cartões translúcidos sobre um fundo animado que acompanha o clima.

## Funcionalidades

- **Localização automática:** solicita a permissão do navegador ao abrir a página. O botão **Usar minha localização** permite tentar novamente; a busca manual continua disponível se a permissão for negada.
- **Identificação da cidade:** usa as coordenadas atuais para identificar o nome. No Brasil, prioriza o município nos dados administrativos, evitando mostrar apenas a região metropolitana quando o município está disponível.
- **Sugestões de cidades:** a partir de dois caracteres, busca até seis opções após uma pausa de 300 ms na digitação. Mostra cidade, estado e país.
- **Seleção por mouse ou teclado:** clique na sugestão ou use **↑**, **↓** e **Enter**. **Esc** fecha a lista. A previsão usa as coordenadas da opção escolhida para diferenciar cidades com nomes iguais.
- **Condições atuais:** temperatura, sensação térmica, condição do tempo, umidade, velocidade e direção do vento.
- **Previsão por hora:** até 12 horários futuros, com temperatura, ícones animados e probabilidade de chuva.
- **Previsão para 10 dias:** mínimas, máximas, condição do tempo, probabilidade de chuva e barras comparativas de temperatura.
- **Fundo dinâmico:** sol com raios em movimento, nuvens, chuva, neve, neblina e relâmpagos. As cores variam conforme a temperatura e o período do dia, sem depender de uma imagem estática ou API de imagens.

As animações respeitam a preferência de movimento reduzido do sistema. As partículas de chuva e neve pausam quando a aba está oculta.

## Tecnologias e serviços

- Backend: Java 17, Spring Boot 3, Maven e `RestClient`.
- Frontend: HTML5, CSS3 e JavaScript com módulos ES, CSS e Canvas para o fundo, e Lottie para ícones animados locais.
- Previsão e sugestões: [Open-Meteo](https://open-meteo.com/en/docs) e sua [API de geocodificação](https://open-meteo.com/en/docs/geocoding-api).
- Nome da cidade pela posição atual: [BigDataCloud](https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free), consultada diretamente pelo navegador.
- Sem banco de dados ou chaves de API configuradas no projeto.

## Estrutura

```text
backend/
  src/main/java/br/com/previsaotempo/
    client/       Integração com Open-Meteo
    config/       Configuração de CORS
    controller/   Endpoint da previsão
    dto/          Dados da resposta
    exception/    Tratamento de erros
    service/      Transformação da previsão
  src/test/       Testes do backend
frontend/
  index.html      Página principal
  css/            Estilos e animações
  js/             Busca, localização, sugestões e renderização
  assets/weather/ Ícones Lottie e informações de licença
  tests/          Testes de localização e sugestões
```

A aplicação descrita aqui usa `backend/pom.xml`. Os scripts de inicialização apontam para esse módulo.

## Executar no Windows

### Pré-requisitos

- JDK 17, com Java disponível no terminal e `JAVA_HOME` configurado.
- Node.js e npm disponíveis no terminal. Para os testes do frontend, use uma versão atual com suporte a `node --test`.
- Acesso à internet para consultar os serviços externos e baixar dependências na primeira execução.

O Maven Wrapper está incluído; não é necessário instalar o Maven separadamente.

### Inicialização

Na raiz do projeto, execute:

```powershell
.\iniciar-tudo.bat
```

Esse script abre backend e frontend em janelas separadas. Também é possível iniciá-los individualmente:

```powershell
.\iniciar-backend.bat
.\iniciar-frontend.bat
```

Abra [http://localhost:5500](http://localhost:5500). O backend atende em `http://localhost:8080`. O frontend usa `npx --yes serve frontend --listen 5500`.

Aceite a permissão de localização para carregar a previsão automaticamente ou digite uma cidade. Ao alterar o backend, reinicie seu processo. Após alterações no frontend, atualize a página com **Ctrl + F5**.

### Depuração no VS Code

Abra a raiz do projeto e selecione **Debug: Backend Spring Boot** na aba **Run and Debug** (`F5`). A configuração em `.vscode/launch.json` inicia o módulo `backend` com o depurador Java conectado.

O CORS aceita `http://localhost:5500` e `http://127.0.0.1:5500`. Se mudar a porta ou o endereço, ajuste `backend/src/main/java/br/com/previsaotempo/config/WebConfig.java` e, se necessário, a URL do backend em `frontend/js/api.js`.

## API do backend

Consulte pelo nome da cidade:

```http
GET http://localhost:8080/api/previsao?cidade=Curitiba
```

Ou pelas coordenadas:

```http
GET http://localhost:8080/api/previsao?latitude=-25.4284&longitude=-49.2733
```

Informe apenas uma das formas de consulta. Na consulta por coordenadas, latitude e longitude são obrigatórias.

Exemplo resumido da estrutura da resposta, com as listas omitidas:

```json
{
  "cidade": "Curitiba",
  "pais": "BR",
  "latitude": -25.4284,
  "longitude": -49.2733,
  "atual": {
    "temperatura": 22.4,
    "sensacaoTermica": 23.1,
    "umidade": 68,
    "vento": 12.6,
    "direcaoVento": 135,
    "condicao": "Clouds",
    "descricao": "nublado",
    "icone": "03d"
  },
  "previsaoHoraria": [],
  "previsaoDiaria": [],
  "avisos": [],
  "fusoHorario": "America/Sao_Paulo"
}
```

`previsaoHoraria` retorna até 24 horários futuros; a interface mostra os primeiros 12. `previsaoDiaria` contém até 10 dias. Os instantes são timestamps Unix em segundos; a interface usa `fusoHorario` para exibir horários e dias da cidade consultada.

Na consulta por coordenadas, o backend retorna o rótulo **Localização atual**. O frontend identifica o nome pela BigDataCloud ou usa o nome da sugestão selecionada. A lista `avisos` está presente na resposta, mas atualmente o backend retorna uma lista vazia.

## Localização e limitações

A precisão das coordenadas depende do navegador e do dispositivo. Quando a margem informada ultrapassa 1 km, a interface avisa que a localização é aproximada. Pesquisar ou selecionar a cidade permite consultar o local desejado.

Com a permissão concedida, as coordenadas são enviadas ao backend para a previsão e à BigDataCloud para identificar a cidade. A BigDataCloud é chamada apenas para a posição atual obtida no dispositivo; cidades escolhidas nas sugestões não usam esse serviço. O texto digitado para sugestões é enviado à API de geocodificação da Open-Meteo.

Se a identificação do nome falhar, a previsão por coordenadas continua disponível com **Cidade não identificada** e um aviso. Se as sugestões falharem, a busca manual continua disponível. O nome do município depende das coordenadas e da cobertura dos dados externos.

## Testes

Backend:

```powershell
.\mvnw.cmd -f backend/pom.xml test
```

Frontend:

```powershell
node --test frontend/tests/*.test.mjs
```

Os testes usam mocks e não consultam os serviços externos. Cobrem validação da API, transformação da previsão, horários e dias, localização automática, identificação do município, falhas de localização, sugestões, seleção pelo teclado e descarte de respostas atrasadas.
