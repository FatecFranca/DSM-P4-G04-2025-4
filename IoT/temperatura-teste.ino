#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LittleFS.h>

// Configurações de WiFi
const char* ssid = "PocoX6";
const char* password = "12345678"; 
const char* apiBase = "http://13.68.97.186:4000"; 

// Configurações do sensor DS18B20
#define ONE_WIRE_BUS 15 // Pino onde os sensores estão conectados
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
String tipoTeste; // Tipo de teste ("quente", "fria")
int coposIds[3] = {0, 0, 0}; // Array dos ID dos copos testados
int numCopos = 0; // Número de copos neste teste (máx 3)

bool testRunning = false; // Flag para indicar se um teste está em execução
unsigned long startTime; 
String startTimestamp; // Timestamp de início do teste
unsigned long lastCommandCheck = 0;
const unsigned long commandPollInterval = 5000; 
unsigned long lastPendingSendAttempt = 0;
const unsigned long pendingSendInterval = 30000; // Tenta enviar dados pendentes a cada 30 segundos
unsigned long lastWifiCheck = 0; // Para verificar o WiFi
const unsigned long wifiCheckInterval = 10000; // Intervalo de verificação do WiFi
bool t0_captured = false; // Para verificar se T0 foi capturado
int lastMinuteLogged = -1; // Para armazenar o último minuto logado


// Diretório no LittleFS para armazenar dados de envio pendente
const char* PENDING_DIR = "/pending";

float temperatureData[13][3];

// Calcula o coeficiente K de decaimento de temperatura
float calcularK(float t0, float tFinal, float tempAmbiente, float tempoHoras) {
    if (t0 == tempAmbiente || tFinal <= tempAmbiente) {
        Serial.println("AVISO: Não foi possível calcular K (temperaturas inválidas).");
        return 0.0;
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
    String out = "";
    const int maxAttempts = 20;
    int attempts = 0; 

    while (attempts < maxAttempts) {
        http.begin("http://worldtimeapi.org/api/timezone/America/Sao_Paulo");
        http.setConnectTimeout(5000); 
        http.setTimeout(5000); 

        int code = http.GET();

        if (code == 200) {
            String response = http.getString();
            StaticJsonDocument<512> doc; 
            DeserializationError error = deserializeJson(doc, response);

            if (!error) {
                String datetime = doc["datetime"].as<String>();
                int tPos = datetime.indexOf('T');
                int dotPos = datetime.indexOf('.');
                if (tPos != -1 && dotPos != -1) {
                    out = datetime.substring(0, tPos) + " " + datetime.substring(tPos + 1, dotPos);
                } else if (tPos != -1) { 
                    int plusPos = datetime.indexOf('+');
                    int minusPos = datetime.indexOf('-'); 
                    int tzPos = (plusPos != -1) ? plusPos : ((minusPos != -1) ? minusPos : -1);

                    if (tzPos != -1) {
                        out = datetime.substring(0, tPos) + " " + datetime.substring(tPos + 1, tzPos);
                    } else { 
                        out = datetime.substring(0, tPos) + " " + datetime.substring(tPos + 1);
                    }
                }
                Serial.printf("Timestamp obtido (America/Sao_Paulo): %s\n", out.c_str()); // Log ajustado
                break; // Sai do loop se obtiver sucesso
            } else {
                Serial.printf("Erro ao analisar JSON do WorldTimeAPI: %s\n", error.c_str());
            }
        } else {
            Serial.printf("Falha ao obter hora do WorldTimeAPI (HTTP %d) para America/Sao_Paulo. Tentativa %d de %d\n", code, attempts + 1, maxAttempts);
        }   
        http.end(); 
        attempts++;
        delay(2000);
    }
    if (attempts == maxAttempts) {
        Serial.println("Falha ao obter hora após várias tentativas.");
    }
    return out; 
}


// Salva um JSON em um arquivo no LittleFS para envio posterior se a conexão com a API falhar no momento da transmissão
void salvarDadosPendentes(const String& payload, int cmdId, int cupId) {
    if (!LittleFS.begin(false)) {
        Serial.println("LittleFS Mount Failed! Cannot save pending data.");
        return;
    }

    String filename = String(PENDING_DIR) + "/cmd_" + cmdId + "cup" + cupId + "_" + millis() + ".json";

    Serial.printf("Salvando dados pendentes para %s...\n", filename.c_str());

    File file = LittleFS.open(filename, FILE_WRITE);
    if (!file) {
        Serial.println("Falha ao abrir arquivo para escrita no LittleFS.");
        LittleFS.end(); 
        return;
    }

    if (file.print(payload)) {
        Serial.println("Dados salvos com sucesso no LittleFS.");
    } else {
        Serial.println("Falha ao escrever dados no arquivo LittleFS.");
    }

    file.close(); 
    LittleFS.end();
}

void enviarDadosPendentes() {
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }
    if (!LittleFS.begin(false)) {
        Serial.println("LittleFS Mount Failed! Cannot send pending data.");
        return;
    }
    File root = LittleFS.open(PENDING_DIR);
    if (!root) {
        Serial.printf("Falha ao abrir diretório %s\n", PENDING_DIR);
        LittleFS.end();
        return;
    }
    if (!root.isDirectory()) {
        Serial.printf("%s não é um diretório\n", PENDING_DIR);
        root.close();
        LittleFS.end();
        return;
    }
    Serial.println("\nVerificando dados pendentes para envio...");
    File file = root.openNextFile();
    while (file) {
        if (!file.isDirectory()) { 
            String filename = file.name();
            String filePath = String(PENDING_DIR) + "/" + filename;
            Serial.printf("Encontrado arquivo pendente: %s\n", filePath.c_str());

            String payload = "";
            while (file.available()) {
                payload += (char)file.read();
            }
            file.close(); 

            String endpoint = String(apiBase) + "/resultadosTestes";
            Serial.printf("Tentando enviar dados do arquivo %s...\n", filename.c_str());

            if (enviarComRetry(endpoint, payload, 5)) {
                Serial.printf("Dados do arquivo %s enviados com sucesso. Excluindo arquivo...\n", filename.c_str());
                if (LittleFS.remove(filePath)) {
                    Serial.printf("Arquivo %s excluído com sucesso.\n", filePath.c_str());
                } else {
                    Serial.printf("Falha ao excluir arquivo %s.\n", filePath.c_str());
                }
            } else {
                Serial.printf("Falha ao enviar dados do arquivo %s após retentativas. Deixando para próxima tentativa.\n", filename.c_str());
            }
        }
        file = root.openNextFile(); 
    }
    root.close(); 
    LittleFS.end(); 
}

void setup() {
    Serial.begin(115200); // Inicializa a comunicação serial para logs no Arduino IDE

    Serial.println("\nIniciando ESP32...");
    Serial.printf("Conectando ao WiFi: %s\n", ssid);
    WiFi.begin(ssid, password);

    // Espera a conexão WiFi
    int wifi_connect_timeout = 0;
    while (WiFi.status() != WL_CONNECTED && wifi_connect_timeout < 20) { 
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
    }


    Serial.println("Inicializando sensores DS18B20...");
    sensors.begin(); 
    int deviceCount = sensors.getDeviceCount();
    Serial.printf("Sensores encontrados: %d\n", deviceCount);

        // Inicializa LittleFS para salvar teste, se houver falha de conexão no envio de dados do teste.
    Serial.println("Inicializando LittleFS...");
    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS Mount Failed!");
        return; 
    }
    Serial.println("LittleFS montado com sucesso.");

    // Cria o diretório para dados pendentes se não existir
    if (!LittleFS.exists(PENDING_DIR)) {
        Serial.printf("Diretório %s não encontrado. Criando...\n", PENDING_DIR);
        if (LittleFS.mkdir(PENDING_DIR)) {
            Serial.printf("Diretório %s criado com sucesso.\n", PENDING_DIR);
        } else {
            Serial.printf("Falha ao criar diretório %s.\n", PENDING_DIR);
        }
    } else {
        Serial.printf("Diretório %s já existe.\n", PENDING_DIR);
    }

    LittleFS.end();
    Serial.println("LittleFS desmontado.");

    delay(10); // Pequeno delay para estabilidade
}

void loop() {
    // Verifica e tenta reconectar o WiFi se necessário
    if (WiFi.status() != WL_CONNECTED) {
        unsigned long currentMillis = millis();
        if (currentMillis - lastWifiCheck > wifiCheckInterval) {
            lastWifiCheck = currentMillis;
            Serial.println("WiFi desconectado. Tentando reconectar...");
            WiFi.disconnect();
            WiFi.reconnect();
        }
    }

    // --- Lógica para enviar dados pendentes ---
    unsigned long currentMillis = millis();
    if (currentMillis - lastPendingSendAttempt >= pendingSendInterval) {
        lastPendingSendAttempt = currentMillis;
        enviarDadosPendentes();
    }

    // --- Lógica para buscar comando ---
    if (!testRunning && WiFi.status() == WL_CONNECTED) {
        if (currentMillis - lastCommandCheck >= commandPollInterval) {
            lastCommandCheck = currentMillis;
            buscarComando();
        }
    }

    // --- Lógica do Teste em Execução ---
    if (testRunning) {
        unsigned long elapsedTime = currentMillis - startTime; 

        if (elapsedTime == 0 && !t0_captured) { // Captura T0 exatamente no início
             capturarTemperaturas(0); 
             t0_captured = true; 
             lastMinuteLogged = 0; 
        }
        // Medições T10 a T120
        else if (t0_captured && elapsedTime > 0 && (elapsedTime % 600000 == 0)) { // 600000 ms = 10 minutos
             int measurementIndex = elapsedTime / 600000;
             if (measurementIndex >= 1 && measurementIndex <= 12) {
                 static int lastMeasurementIndex = -1;
                 if (measurementIndex > lastMeasurementIndex) {
                     capturarTemperaturas(measurementIndex);
                     lastMeasurementIndex = measurementIndex;
                     lastMinuteLogged = measurementIndex * 10; // Atualiza o último minuto logado
                 }
             }
        }

        // Lógica para finalizar o teste após 120 minutos (120 * 60 * 1000)
        if (testRunning && elapsedTime >= (120 * 60 * 1000UL)) { 
            Serial.println("\nTeste concluído (120 minutos atingidos). Enviando dados...");
            enviarDados(); // Envia todos os dados coletados
            testRunning = false; // Termina o teste
            // Reseta todas as variáveis para o próximo teste
            comandoId = -1; 
            usuarioId = -1;
            numCopos = 0;
            t0_captured = false;
            lastMinuteLogged = -1;
            static int lastMeasurementIndex = -1; 
            lastMeasurementIndex = -1;
            Serial.println("Teste finalizado. Aguardando novo comando...");
        }

        // Logar o tempo decorrido a cada minuto
        int elapsedMinutes = elapsedTime / 60000;
        if (elapsedMinutes > lastMinuteLogged) {
             Serial.printf("Teste em andamento: %d minutos decorridos...\n", elapsedMinutes);
             lastMinuteLogged = elapsedMinutes;
        }
    } 
    delay(10); // Pequeno delay para evitar watchdog timer reset e manter estabilidade
}

void buscarComando() {

    Serial.println("\n------------------------------------");
    Serial.println("Verificando por comando pendente na API...");

    String endpoint = String(apiBase) + "/comando-pendente";
    HTTPClient http;
    http.begin(endpoint);

    http.setConnectTimeout(5000); // Timeout de conexão
    http.setTimeout(5000); // Timeout de leitura

    int resp = http.GET(); 

    // Log do status da conexão ---
    if (resp >= 200 && resp < 300) { // Códigos 2xx indicam sucesso
        Serial.printf("Conexão com API bem-sucedida (HTTP %d).\n", resp);
    } else {
        Serial.printf("Falha na conexão com API (HTTP %d).\n", resp);
        http.end(); 
        Serial.println("------------------------------------");
        return;
    }

    String payload = http.getString();
    http.end(); 

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
        }
    } else {
        Serial.printf("Erro ao analisar JSON da resposta da API: %s\n", error.c_str());
    }
     Serial.println("------------------------------------");
}

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


void iniciarTeste() {
    Serial.println("Preparando para iniciar teste...");
    startTimestamp = getCurrentTime(); 
    if (startTimestamp.isEmpty()) {
        Serial.println("Falha ao obter timestamp de início. Não é possível iniciar o teste.");
        return;
    }
    testRunning = true; 
    startTime = millis();
    for (int i = 0; i < 13; i++) {
        for (int j = 0; j < 3; j++) {
            temperatureData[i][j] = -999.0; // Usa um valor que indica 'não medido'
        }
    }
    Serial.printf("Teste iniciado para Usuário %d, Tipo %s, Copos %d. Início: %s\n",
                  usuarioId, tipoTeste.c_str(), numCopos, startTimestamp.c_str());
    Serial.println("Iniciando captura da temperatura T0...");
    capturarTemperaturas(0); 
    bool testeConcluido = true; 
    if (testeConcluido) {
        String payload = criarPayloadDeTemperaturas(); 
        salvarDadosPendentes(payload, comandoId, numCopos); 
    } else {
        Serial.println("Teste não concluído, dados não salvos.");
    }
}


String criarPayloadDeTemperaturas() {
    String payload = "{ \"dados\": [";
    for (int i = 0; i < 13; i++) {
        for (int j = 0; j < numCopos; j++) {
            payload += String(temperatureData[i][j]);
            if (j < numCopos - 1 || i < 12) { 
                payload += ",";
            }
        }
    }
    payload += "] }"; 
    return payload;
}

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
    sensors.requestTemperatures();

    for (int i = 0; i < numCopos; i++) {
        float tempC = sensors.getTempC(sensores[i]); 

        if (tempC != DEVICE_DISCONNECTED_C) { // DEVICE_DISCONNECTED_C é -127.0
            temperatureData[index][i] = tempC;
            Serial.printf("  Copo %d (ID %d): %.2f C\n", i + 1, coposIds[i], tempC);
        } else {
            temperatureData[index][i] = -127.0; // Armazena o valor de erro se a leitura falhou
            Serial.printf("  Copo %d (ID %d): ERRO DE LEITURA (-127.0)\n", i + 1, coposIds[i]);
        }
    }
}

void enviarDados() {
    String endpoint = String(apiBase) + "/resultadosTestes";
    String endTimestamp = getCurrentTime(); 

    if (endTimestamp.isEmpty()) {
         Serial.println("AVISO: Não foi possível obter timestamp de fim. Enviando dados com data de fim vazia.");
    }

    Serial.println("\nEnviando resultados do teste para a API...");

    for (int i = 0; i < numCopos; i++) {
        float t0 = temperatureData[0][i];      
        float tFinal = temperatureData[12][i];  
        float tempAmbiente = 25.0;            
        float tempoHoras = 2.0;  

        float k = calcularK(t0, tFinal, tempAmbiente, tempoHoras);

        // Constrói o payload JSON para este copo
        String payload = "{";
        payload += "\"usuario_id\":" + String(usuarioId) + ",";
        payload += "\"copo_id\":" + String(coposIds[i]) + ",";
        payload += "\"tipo\":\"" + tipoTeste + "\",";
        payload += "\"data_inicio\":\"" + startTimestamp + "\","; // Timestamp do início do teste
        payload += "\"data_fim\":\"" + endTimestamp + "\",";     // Timestamp do fim do teste

        for (int j = 0; j < 13; j++) {
            payload += "\"t" + String(j * 10) + "\":" + String(temperatureData[j][i], 2); // Formata com 2 casas decimais
            payload += ","; 
        }
 
        payload += "\"k\":" + String(k, 6); 
        payload += "}"; 

        Serial.printf("Enviando dados para Copo %d (ID %d)...\n", i+1, coposIds[i]);
        bool sucesso = enviarComRetry(endpoint, payload, 5); // Tenta enviar 5 vezes

        if (!sucesso) {
            Serial.printf("Falha no envio dos dados do Copo %d (ID %d) após retentativas.\n", i+1, coposIds[i]);
            // * Salva dados na memória do IoT se conexão falhar *
            salvarDadosPendentes(payload, comandoId, coposIds[i]);
        } else {
            Serial.printf("Dados do Copo %d (ID %d) enviados com sucesso.\n", i+1, coposIds[i]);
        }
    }
    Serial.println("Processo de envio de resultados concluído.");
}