#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Certifique-se de ter a biblioteca instalada (v6 ou superior)
#include <LittleFS.h>
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
unsigned long lastCommandCheck = 0;
const unsigned long commandPollInterval = 5000; // 5 segundos
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
    String out = "";
    const int maxAttempts = 10; // Número máximo de tentativas
    int attempts = 0; // Contador de tentativas

    while (attempts < maxAttempts) {
        // Configura o endpoint para solicitar o horário da timezone America/Sao_Paulo
        http.begin("http://worldtimeapi.org/api/timezone/America/Sao_Paulo");
        http.setConnectTimeout(2000); // Timeout de conexão
        http.setTimeout(2000); // Timeout de leitura

        int code = http.GET();

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
                Serial.printf("Timestamp obtido (America/Sao_Paulo): %s\n", out.c_str()); // Log ajustado
                break; // Sai do loop se obtiver sucesso
            } else {
                Serial.printf("Erro ao analisar JSON do WorldTimeAPI: %s\n", error.c_str());
            }
        } else {
            Serial.printf("Falha ao obter hora do WorldTimeAPI (HTTP %d) para America/Sao_Paulo. Tentativa %d de %d\n", code, attempts + 1, maxAttempts);
        }   
        http.end(); // Finaliza a conexão
        attempts++;
        delay(2000); // Espera 2 segundos antes da próxima tentativa
    }
    if (attempts == maxAttempts) {
        Serial.println("Falha ao obter hora após várias tentativas.");
    }
    return out; // Retorna a string formatada ou vazia em caso de erro
}


// Salva um payload JSON em um arquivo no LittleFS para envio posterior
void salvarDadosPendentes(const String& payload, int cmdId, int cupId) {
    // Monta LittleFS (false para não formatar se falhar)
    if (!LittleFS.begin(false)) {
        Serial.println("LittleFS Mount Failed! Cannot save pending data.");
        return;
    }

    // Cria um nome de arquivo único (ex: /pending/cmd_123_cup_1_1678886400000.json)
    // Usa millis() para garantir unicidade, pode usar timestamp real se disponível e confiável
    String filename = String(PENDING_DIR) + "/cmd_" + cmdId + "cup" + cupId + "_" + millis() + ".json";

    Serial.printf("Salvando dados pendentes para %s...\n", filename.c_str());

    File file = LittleFS.open(filename, FILE_WRITE);
    if (!file) {
        Serial.println("Falha ao abrir arquivo para escrita no LittleFS.");
        LittleFS.end(); // Desmonta LittleFS
        return;
    }

    if (file.print(payload)) {
        Serial.println("Dados salvos com sucesso no LittleFS.");
    } else {
        Serial.println("Falha ao escrever dados no arquivo LittleFS.");
    }

    file.close(); // Fecha o arquivo
    LittleFS.end(); // Desmonta LittleFS
}

void enviarDadosPendentes() {
    if (WiFi.status() != WL_CONNECTED) {
        return; // Não tenta enviar se não houver WiFi
    }
    // Monta LittleFS (false para não formatar se falhar)
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
        if (!file.isDirectory()) { // Processa apenas arquivos, ignora subdiretórios
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

        // Inicializa LittleFS
    Serial.println("Inicializando LittleFS...");
    // Tenta montar o sistema de arquivos. true formata se a montagem falhar pela 1a vez.
    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS Mount Failed!");
        // Considere adicionar uma ação de erro mais robusta aqui
        // (ex: reiniciar, tentar novamente, alertar)
        return; // Sai do setup ou lida com o erro
    }
    Serial.println("LittleFS montado com sucesso.");

    // Cria o diretório para dados pendentes se não existir
    if (!LittleFS.exists(PENDING_DIR)) {
        Serial.printf("Diretório %s não encontrado. Criando...\n", PENDING_DIR);
        if (LittleFS.mkdir(PENDING_DIR)) {
            Serial.printf("Diretório %s criado com sucesso.\n", PENDING_DIR);
        } else {
            Serial.printf("Falha ao criar diretório %s.\n", PENDING_DIR);
            // Considere lidar com esta falha (ex: não salvar dados pendentes)
        }
    } else {
        Serial.printf("Diretório %s já existe.\n", PENDING_DIR);
    }

    // Desmonta LittleFS após inicialização para liberar recursos
    LittleFS.end();
    Serial.println("LittleFS desmontado.");

    delay(10); // Pequeno delay para estabilidade do ESP32
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
        // Se estiver desconectado, pula o resto do loop que depende de rede,
        // exceto a lógica de teste em andamento que não depende de rede (medição de temperatura).
        // A busca de comando e envio de pendentes só ocorrerão quando reconectar.
        // Continua a execução do teste localmente (coleta de temperaturas).
    }

    // --- Lógica para enviar dados pendentes ---
    unsigned long currentMillis = millis();
    if (currentMillis - lastPendingSendAttempt >= pendingSendInterval) {
        lastPendingSendAttempt = currentMillis;
        // A função enviarDadosPendentes já verifica se o WiFi está conectado
        enviarDadosPendentes();
    }

    // --- Lógica para buscar comando ---
    // Só busca comando se não houver teste em execução E se o WiFi estiver conectado
    if (!testRunning && WiFi.status() == WL_CONNECTED) {
        if (currentMillis - lastCommandCheck >= commandPollInterval) {
            lastCommandCheck = currentMillis;
            buscarComando();
        }
    }

    // --- Lógica do Teste em Execução ---
    if (testRunning) {
        unsigned long elapsedTime = currentMillis - startTime; // Tempo decorrido desde o início do teste

        if (elapsedTime == 0 && !t0_captured) { // Captura T0 exatamente no início
             capturarTemperaturas(0); // Índice 0 para T0
             t0_captured = true; // Marca que T0 foi capturado
             lastMinuteLogged = 0; // Reseta o log de minutos para T0
        }
        // Medições T10 a T120 (a cada 10 minutos = 600 segundos)
        else if (t0_captured && elapsedTime > 0 && (elapsedTime % 600000 == 0)) { // 600000 ms = 10 minutos
             int measurementIndex = elapsedTime / 600000; // 10min=1, 20min=2, ..., 120min=12
             if (measurementIndex >= 1 && measurementIndex <= 12) {
                 // Use uma flag para garantir que a medição para este intervalo ocorra apenas uma vez
                 static int lastMeasurementIndex = -1;
                 if (measurementIndex > lastMeasurementIndex) {
                     capturarTemperaturas(measurementIndex);
                     lastMeasurementIndex = measurementIndex;
                     lastMinuteLogged = measurementIndex * 10; // Atualiza o último minuto logado
                 }
             }
        }

        // Lógica para finalizar o teste após 120 minutos (120 * 60 * 1000 ms)
        if (testRunning && elapsedTime >= (120 * 60 * 1000UL)) { // Use UL para unsigned long literal
            Serial.println("\nTeste concluído (120 minutos atingidos). Enviando dados...");
            enviarDados(); // Envia todos os dados coletados
            testRunning = false; // Termina o teste
            comandoId = -1; // Reseta IDs
            usuarioId = -1;
            numCopos = 0;
            t0_captured = false; // Reseta a flag para o próximo teste
            lastMinuteLogged = -1; // Reseta o log de minutos
            // Resetar lastMeasurementIndex se usado
            static int lastMeasurementIndex = -1; // Declared static inside loop
            lastMeasurementIndex = -1; // Reset for next test
            Serial.println("Teste finalizado. Aguardando novo comando...");
        }

        // Opcional: Logar o tempo decorrido a cada minuto
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
        }
    } else {
        Serial.printf("Erro ao analisar JSON da resposta da API: %s\n", error.c_str());
        Serial.printf("Payload recebido: %s\n", payload.c_str()); // Opcional: logar payload para debug
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
            // * SALVA OS DADOS NO LITTLEFS SE O ENVIO FALHAR *
            salvarDadosPendentes(payload, comandoId, coposIds[i]);
        } else {
            Serial.printf("Dados do Copo %d (ID %d) enviados com sucesso.\n", i+1, coposIds[i]);
        }
    }
    Serial.println("Processo de envio de resultados concluído.");
}