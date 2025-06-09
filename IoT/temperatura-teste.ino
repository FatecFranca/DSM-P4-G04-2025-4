#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Certifique-se de ter a biblioteca instalada (v6 ou superior)

// Configurações de WiFi
const char* ssid = "PocoX6"; // Substitua pelo seu SSID
const char* password = "12345678"; // Substitua pela sua senha
const char* apiBase = "http://13.68.97.186:4000"; // IP do seu backend (servidor), não do ESP32!

// Configurações do sensor DS18B20
#define ONE_WIRE_BUS 15 // Pino GPIO onde os sensores estão conectados
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);


DeviceAddress sensores[3] = {
  { 0x28, 0x36, 0xDD, 0x35, 0x0, 0x0, 0x0, 0x3A }, // Sensor 1
  { 0x28, 0xAE, 0x0F, 0x59, 0x0, 0x0, 0x0, 0x75 }, // Sensor 2
  { 0x28, 0x7F, 0x47, 0xCB, 0x57, 0x23, 0x0B, 0x02 } // Sensor 3
};

// Variáveis de estado do teste
int comandoId = -1; // ID do comando recebido da API
int usuarioId = -1; // ID do usuário associado ao comando
String tipoTeste; // Tipo de teste (ex: "cafe", "cha")
int coposIds[3] = {0, 0, 0}; // IDs dos copos associados a este teste
int numCopos = 0; // Número de copos neste teste (máx 3)

bool testRunning = false; // Flag para indicar se um teste está em execução
unsigned long startTime; // Tempo em millis() quando o teste começou
String startTimestamp; // Timestamp de início do teste (ISO 8601)


float temperatureData[13][3];

// Intervalo para verificar novos comandos na API (em milissegundos)
unsigned long lastCommandCheck = 0;
const unsigned long commandPollInterval = 5000; // 5 segundos

// Calcula o coeficiente K de decaimento de temperatura
float calcularK(float t0, float tFinal, float tempAmbiente, float tempoHoras) {
    // Evita divisão por zero ou logaritmo de valor <= 0
    if (t0 == tempAmbiente || tFinal <= tempAmbiente) {
        Serial.println("AVISO: Não foi possível calcular K (temperaturas inválidas).");
        return 0.0; // Retorna 0 ou outro valor indicando erro/impossibilidade
    }
    float numerador = tFinal - tempAmbiente;
    float denominador = t0 - tempAmbiente;
    float ratio = numerador / denominador;

    if (ratio <= 0) {
         Serial.println("AVISO: Não foi possível calcular K (ratio <= 0).");
         return 0.0;
    }

    float ln = log(ratio);
    float k = -ln / tempoHoras;
    return k;
}

// Envia um POST para um endpoint com retentativas em caso de falha
bool enviarComRetry(const String& endpoint, const String& payload, int tentativas = 3) {
    int resp = -1;
    Serial.printf("Tentando enviar POST para: %s\n", endpoint.c_str());
    Serial.printf("Payload: %s\n", payload.c_str());

    for (int tentativa = 1; tentativa <= tentativas; tentativa++) {
        HTTPClient http;
        http.begin(endpoint);
        http.addHeader("Content-Type", "application/json");

        // Define um timeout para a conexão e leitura (ex: 5 segundos)
        http.setConnectTimeout(5000);
        http.setTimeout(5000);

        resp = http.POST(payload);
        http.end(); // Sempre fechar a conexão

        if (resp >= 200 && resp < 300) { // Códigos 2xx indicam sucesso
            Serial.printf("POST para [%s] bem-sucedido na tentativa %d (HTTP %d)\n", endpoint.c_str(), tentativa, resp);
            return true;
        } else if (resp == 409) { // Conflito (ex: resultado já existe)
             Serial.printf("POST para [%s] retornou CONFLITO (HTTP %d). Dado já existe? Tentativa %d/%d\n", endpoint.c_str(), resp, tentativa, tentativas);
             return true; // Considera sucesso se o backend disse que já existe
        }
        else {
            Serial.printf("Falha ao enviar para [%s] (HTTP %d) - tentativa %d/%d\n", endpoint.c_str(), resp, tentativa, tentativas);
            if (tentativa < tentativas) {
                delay(1000); // Espera 1s antes de nova tentativa
            }
        }
    }
    Serial.printf("Falha definitiva após %d tentativas para endpoint [%s]. Último código: %d\n", tentativas, endpoint.c_str(), resp);
    return false;
}

// Consulta a hora atual em um servidor NTP via API externa (worldtimeapi)
String getCurrentTime() {
    HTTPClient http;
    http.begin("http://worldtimeapi.org/api/ip"); // Usa o IP público do ESP32 para determinar a timezone
    http.setConnectTimeout(5000); // Timeout de conexão
    http.setTimeout(5000); // Timeout de leitura

    int code = http.GET();
    String out = "";

    if (code == 200) {
        String response = http.getString();
        StaticJsonDocument<512> doc; // Tamanho ajustado
        DeserializationError error = deserializeJson(doc, response);

        if (!error) {
            String datetime = doc["datetime"].as<String>();
            int tPos = datetime.indexOf('T');
            int dotPos = datetime.indexOf('.');
            if (tPos != -1 && dotPos != -1) {
                out = datetime.substring(0, tPos) + " " + datetime.substring(tPos + 1, dotPos);
            } else if (tPos != -1) { // Caso não tenha milissegundos
                 int plusPos = datetime.indexOf('+');
                 int minusPos = datetime.indexOf('-'); // Para offset negativo
                 int tzPos = (plusPos != -1) ? plusPos : ((minusPos != -1) ? minusPos : -1);

                 if (tzPos != -1) {
                     out = datetime.substring(0, tPos) + " " + datetime.substring(tPos + 1, tzPos);
                 } else { // Sem milissegundos e sem offset? (improvável, mas fallback)
                     out = datetime.substring(0, tPos) + " " + datetime.substring(tPos + 1);
                 }
            }
             Serial.printf("Timestamp obtido: %s\n", out.c_str());
        } else {
            Serial.printf("Erro ao analisar JSON do WorldTimeAPI: %s\n", error.c_str());
            // Fallback: tentar obter hora local do ESP32 se NTP estiver configurado (não neste código)
        }
    } else {
        Serial.printf("Falha ao obter hora do WorldTimeAPI (HTTP %d)\n", code);
    }
    http.end();
    return out; // Retorna a string formatada ou vazia em caso de erro
}



void setup() {
    Serial.begin(115200); // Inicializa a comunicação serial para logs

    Serial.println("\nIniciando ESP32...");
    Serial.printf("Conectando ao WiFi: %s\n", ssid);
    WiFi.begin(ssid, password);

    // Espera a conexão WiFi
    int wifi_connect_timeout = 0;
    while (WiFi.status() != WL_CONNECTED && wifi_connect_timeout < 20) { // Timeout de 20s
        delay(1000);
        Serial.print(".");
        wifi_connect_timeout++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi conectado com sucesso!");
        Serial.print("Endereço IP do ESP32: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nFalha na conexão WiFi. Verifique SSID/Senha ou sinal.");
        // Considere reiniciar ou entrar em modo de recuperação aqui
    }


    Serial.println("Inicializando sensores DS18B20...");
    sensors.begin(); // Inicializa a biblioteca DallasTemperature
    int deviceCount = sensors.getDeviceCount();
    Serial.printf("Sensores encontrados: %d\n", deviceCount);
}

void loop() {
    // Garante que o WiFi está conectado antes de tentar qualquer comunicação HTTP
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi desconectado. Tentando reconectar...");
        WiFi.reconnect();
        delay(5000); // Espera antes de verificar novamente
        return; // Pula o resto do loop até reconectar
    }

    // Verifica por comando pendente na API se não houver teste em execução
    // e se o intervalo de polling já passou.
    if (!testRunning && (millis() - lastCommandCheck >= commandPollInterval)) {
        buscarComando(); // Chama a função para buscar comando
        lastCommandCheck = millis(); // Atualiza o tempo da última checagem
    }

    // --- Lógica de Execução do Teste ---
    if (testRunning) {
        unsigned long elapsedTime = (millis() - startTime) / 1000; // Tempo decorrido em segundos

        // O teste dura 120 minutos (7200 segundos)
        if (elapsedTime <= 7200) {
            // Calcula o índice da medição (0 para T0, 1 para T10, ..., 12 para T120)
            // A medição T(n*10) ocorre no tempo n*600 segundos.
            int index = elapsedTime / 600; // Ex: 600s/600=1 (T10), 1200s/600=2 (T20), ..., 7200s/600=12 (T120)

            // Verifica se é hora de fazer uma medição (a cada 10 minutos = 600 segundos)
            // e se o índice está dentro dos limites do array temperatureData (0 a 12)
            if (elapsedTime % 600 == 0 && index < 13) {
                capturarTemperaturas(index); // Chama a função para ler e armazenar temperaturas

            }
             if (elapsedTime > 0 && elapsedTime % 60 == 0 && elapsedTime <= 7200) {
                 Serial.printf("Teste em andamento: %lu minutos decorridos.\n", elapsedTime / 60);
             }

        } else { // Teste terminou (passou de 120 minutos)
            Serial.println("\nTeste concluído (120 minutos).");
            testRunning = false; // Para o teste

            // Envia os dados coletados para a API
            enviarDados();

            // Opcional: Resetar variáveis de estado do teste
            comandoId = -1;
            usuarioId = -1;
            tipoTeste = "";
            numCopos = 0;
            // Limpar temperatureData se necessário
        }
    }

    delay(50); // Pequeno delay para estabilidade do ESP32
}

void buscarComando() {

    Serial.println("\n------------------------------------");
    Serial.println("Verificando por comando pendente na API...");

    String endpoint = String(apiBase) + "/comando-pendente";
    HTTPClient http;
    http.begin(endpoint);

    http.setConnectTimeout(5000); // Timeout de conexão
    http.setTimeout(5000); // Timeout de leitura

    int resp = http.GET(); // Faz a requisição GET

    // --- ADICIONADO: Log do status da conexão ---
    if (resp >= 200 && resp < 300) { // Códigos 2xx indicam sucesso
        Serial.printf("Conexão com API bem-sucedida (HTTP %d).\n", resp);
    } else {
        Serial.printf("Falha na conexão com API (HTTP %d).\n", resp);
        http.end(); // Fechar conexão em caso de erro
        Serial.println("------------------------------------");
        return; // Sai da função se a requisição falhou
    }

    String payload = http.getString();
    http.end(); // Fecha a conexão HTTP após obter a resposta

    StaticJsonDocument<512> doc; // Tamanho ajustado para a resposta esperada
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
        bool iniciar = doc["iniciar"];

        if (iniciar) {
            JsonObject comando = doc["comando"];
            comandoId = comando["id"];
            usuarioId = comando["usuario_id"];
            tipoTeste = comando["tipo"].as<String>();

            // O array de copos vem como string JSON, precisa deserializar novamente
            String coposStr = comando["copos"].as<String>();
            StaticJsonDocument<64> coposDoc; // Tamanho suficiente para ["1","2","3"]
            DeserializationError coposError = deserializeJson(coposDoc, coposStr);

            if (!coposError && coposDoc.is<JsonArray>()) {
                 JsonArray coposArray = coposDoc.as<JsonArray>();
                 numCopos = 0;
                 for (JsonVariant v : coposArray) {
                     if (numCopos < 3) { // Limita a no máximo 3 copos
                         coposIds[numCopos] = v.as<int>();
                         numCopos++;
                     }
                 }
                 Serial.printf("Comando ID: %d, Usuário ID: %d, Tipo: %s, Copos: %d\n",
                               comandoId, usuarioId, tipoTeste.c_str(), numCopos);

                 Serial.println("Marcando comando como consumido na API...");
                 marcarConsumido(comandoId); 

            } else {
                 Serial.printf("Erro ao analisar JSON do array de copos: %s\n", coposError.c_str());
            }

        } else {
            Serial.println("Nenhum comando pendente encontrado na API.");
            // -------------------------------------------------
        }
    } else {
        Serial.printf("Erro ao analisar JSON da resposta da API: %s\n", error.c_str());
        Serial.printf("Payload recebido: %s\n", payload.c_str()); // Opcional: logar payload para debug
    }
     Serial.println("------------------------------------");
}

// Notifica a API que o comando foi consumido e, se sucesso, inicia o teste
void marcarConsumido(int id) {
    String endpoint = String(apiBase) + "/comando-consumido";
    String payload = String("{\"id\":") + id + "}";

    bool sucesso = enviarComRetry(endpoint, payload, 3); // Tenta enviar 3 vezes

    if (sucesso) {
        Serial.println("Comando marcado como consumido com sucesso na API.");
        iniciarTeste();
    } else {
        Serial.println("Falha ao marcar comando como consumido após retentativas. Não iniciando teste localmente.");
    }
}

// Inicia o ciclo de teste localmente no ESP32
void iniciarTeste() {
    Serial.println("Preparando para iniciar teste...");
    startTimestamp = getCurrentTime(); // Obtém o timestamp de início do teste

    if (startTimestamp.isEmpty()) {
        Serial.println("Falha ao obter timestamp de início. Não é possível iniciar o teste.");
        // Não inicia o teste se não conseguiu obter a hora
        // Poderia tentar novamente obter a hora ou abortar completamente
        return;
    }

    testRunning = true; // Define a flag para iniciar o loop de medição
    startTime = millis(); // Registra o tempo de início usando millis()

    // Zera o array de dados de temperatura antes de começar
    for (int i = 0; i < 13; i++) {
        for (int j = 0; j < 3; j++) {
            temperatureData[i][j] = -999.0; // Usa um valor que indica 'não medido'
        }
    }

    Serial.printf("Teste iniciado para Usuário %d, Tipo %s, Copos %d. Início: %s\n",
                  usuarioId, tipoTeste.c_str(), numCopos, startTimestamp.c_str());
    Serial.println("Iniciando captura da temperatura T0...");

    // Captura a primeira medição (T0) imediatamente
    capturarTemperaturas(0); // O índice 0 corresponde a T0
}

// Captura as temperaturas dos sensores e armazena no array temperatureData
void capturarTemperaturas(int index) {
    if (index < 0 || index >= 13) {
        Serial.printf("Erro: Índice de medição inválido (%d).\n", index);
        return;
    }
    if (numCopos == 0) {
         Serial.println("Aviso: capturarTemperaturas chamada sem copos definidos.");
         return;
    }

    Serial.printf("Capturando temperaturas para medição T%d (índice %d)...\n", index * 10, index);
    sensors.requestTemperatures(); // Solicita as leituras de todos os sensores

    for (int i = 0; i < numCopos; i++) {
        float tempC = sensors.getTempC(sensores[i]); // Lê a temperatura de um sensor específico

        if (tempC != DEVICE_DISCONNECTED_C) { // DEVICE_DISCONNECTED_C é -127.0
            temperatureData[index][i] = tempC;
            Serial.printf("  Copo %d (ID %d): %.2f C\n", i + 1, coposIds[i], tempC);
        } else {
            temperatureData[index][i] = -127.0; // Armazena o valor de erro se a leitura falhou
            Serial.printf("  Copo %d (ID %d): ERRO DE LEITURA (-127.0)\n", i + 1, coposIds[i]);
        }
    }
}

// Envia os dados coletados durante o teste para a API
void enviarDados() {
    String endpoint = String(apiBase) + "/resultadosTestes";
    String endTimestamp = getCurrentTime(); // Obtém o timestamp de fim do teste

    if (endTimestamp.isEmpty()) {
         Serial.println("AVISO: Não foi possível obter timestamp de fim. Enviando dados com data de fim vazia.");
         // Decide se envia mesmo assim ou aborta
    }

    Serial.println("\nEnviando resultados do teste para a API...");

    // Loop através de cada copo para enviar seus dados individualmente
    for (int i = 0; i < numCopos; i++) {
        float t0 = temperatureData[0][i];       // Temperatura no início (índice 0)
        float tFinal = temperatureData[12][i];  // Temperatura após 120 min (índice 12)
        // TODO: Obter temperatura ambiente de um sensor dedicado ou valor fixo
        float tempAmbiente = 25.0;              // Valor fixo temporário para temperatura ambiente
        float tempoHoras = 2.0;                 // 120 minutos = 2 horas

        // Calcula o coeficiente K para este copo
        float k = calcularK(t0, tFinal, tempAmbiente, tempoHoras);

        // Constrói o payload JSON para este copo
        String payload = "{";
        payload += "\"usuario_id\":" + String(usuarioId) + ",";
        payload += "\"copo_id\":" + String(coposIds[i]) + ",";
        payload += "\"tipo\":\"" + tipoTeste + "\",";
        payload += "\"data_inicio\":\"" + startTimestamp + "\","; // Timestamp do início do teste
        payload += "\"data_fim\":\"" + endTimestamp + "\",";     // Timestamp do fim do teste

        // Adiciona os dados de temperatura T0 a T120
        for (int j = 0; j < 13; j++) {
            payload += "\"t" + String(j * 10) + "\":" + String(temperatureData[j][i], 2); // Formata com 2 casas decimais
            payload += ","; // Adiciona vírgula após cada temperatura
        }
        // Adiciona o valor de K (sem vírgula após ele, pois é o último campo)
        payload += "\"k\":" + String(k, 6); // Formata K com 6 casas decimais para precisão
        payload += "}"; // Fecha o objeto JSON

        // Envia o payload para a API com retentativas
        Serial.printf("Enviando dados para Copo %d (ID %d)...\n", i+1, coposIds[i]);
        bool sucesso = enviarComRetry(endpoint, payload, 5); // Tenta enviar 5 vezes

        if (!sucesso) {
            Serial.printf("Falha no envio dos dados do Copo %d (ID %d) após retentativas.\n", i+1, coposIds[i]);
            // TODO: Implementar lógica de recuperação aqui (ex: salvar em SD card, tentar mais tarde)
        } else {
            Serial.printf("Dados do Copo %d (ID %d) enviados com sucesso.\n", i+1, coposIds[i]);
        }
    }
    Serial.println("Processo de envio de resultados concluído.");
}
