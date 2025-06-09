#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "PocoX6";
const char* password = "12345678";
const char* apiBase = "http://192.168.115.188"; // IP do backend, não do ESP32!

#define ONE_WIRE_BUS 15
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// IDs dos sensores (ajuste conforme seu hardware)
DeviceAddress sensores[3] = {
  { 0x28, 0x36, 0xDD, 0x35, 0x0, 0x0, 0x0, 0x3A },
  { 0x28, 0xAE, 0x0F, 0x59, 0x0, 0x0, 0x0, 0x75 },
  { 0x28, 0x7F, 0x47, 0xCB, 0x57, 0x23, 0x0B, 0x02 }
};

// Variáveis do teste
int comandoId = -1;
int usuarioId = -1;
String tipoTeste;
int coposIds[3] = {0, 0, 0};
int numCopos = 0;

bool testRunning = false;
unsigned long startTime;
String startTimestamp;
float temperatureData[13][3];

float calcularK(float t0, float tFinal, float tempAmbiente, float tempoHoras) {
  float numerador = tFinal - tempAmbiente;
  float denominador = t0 - tempAmbiente;
  // Evita log de zero ou valor negativo
  if (denominador == 0 || numerador <= 0) return 0.0;
  float ratio = numerador / denominador;
  float ln = log(ratio);
  float k = -ln / tempoHoras;
  return k;
}

unsigned long lastCommandCheck = 0;
const unsigned long commandPollInterval = 3000; // 3 segundos

// Função extra: POST tolerante a falhas/retransmissão
bool enviarComRetry(const String& endpoint, const String& payload, int tentativas = 3) {
  int resp = -1;
  for (int tentativa = 1; tentativa <= tentativas; tentativa++) {
    HTTPClient http;
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");
    resp = http.POST(payload);
    http.end();
    if (resp == 200 || resp == 201) {
      Serial.printf("POST para [%s] bem-sucedido na tentativa %d (HTTP %d)\n", endpoint.c_str(), tentativa, resp);
      return true;
    } else {
      Serial.printf("Falha ao enviar para [%s] (HTTP %d) - tentativa %d/%d\n", endpoint.c_str(), resp, tentativa, tentativas);
      delay(1000); // Espera 1s antes de nova tentativa
    }
  }
  Serial.printf("Falha definitiva após %d tentativas para endpoint [%s].\n", tentativas, endpoint.c_str());
  return false;
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando ao WiFi...");
  }
  Serial.println("WiFi conectado!");
  Serial.print("Endereço IP do ESP32: ");
  Serial.println(WiFi.localIP());

  sensors.begin();
}

void loop() {
  // Poll em /comando-pendente a cada 3 segundos se não estiver testando
  if (!testRunning && (millis() - lastCommandCheck > commandPollInterval)) {
    buscarComando();
    lastCommandCheck = millis();
  }

  // Execução do teste
  if (testRunning) {
    unsigned long elapsedTime = (millis() - startTime) / 1000;

    if (elapsedTime <= 7200) {
      int index = elapsedTime / 600;
      if (elapsedTime % 600 == 0 && index < 13) {
        sensors.requestTemperatures();
        for (int i = 0; i < numCopos; i++) {
          float temp = sensors.getTempC(sensores[i]);
          // Se alguma leitura falhar, loga -127/-85 mas armazena mesmo assim
          temperatureData[index][i] = temp;
        }
        Serial.printf("Medição %d min:", index * 10);
        for (int i = 0; i < numCopos; i++)
          Serial.printf(" Sensor%d=%.2f", i+1, temperatureData[index][i]);
        Serial.println();
      }
    } else {
      testRunning = false;
      enviarDados();
    }
  }
  delay(100); // ciclo rápido
}

// Poll REST: busca comando pendente
void buscarComando() {
  String endpoint = String(apiBase) + "/comando-pendente";
  HTTPClient http;
  http.begin(endpoint);
  int resp = http.GET();

  if (resp == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["iniciar"]) {
      JsonObject comando = doc["comando"];
      comandoId = comando["id"];
      usuarioId = comando["usuario_id"];
      tipoTeste = comando["tipo"].as<String>();

      // Copos em formato JSON string: ["1","2","3"]
      String coposStr = comando["copos"].as<String>();
      StaticJsonDocument<64> coposDoc;
      deserializeJson(coposDoc, coposStr);
      numCopos = coposDoc.size();
      for (int i = 0; i < numCopos; i++) {
        coposIds[i] = coposDoc[i];
      }
      Serial.println("Novo comando detectado! ID: " + String(comandoId));
      marcarConsumido(comandoId);
      iniciarTeste();
    }
  }
  http.end();
}

// Notifica que comando foi consumido, com reenvio em caso de falha
void marcarConsumido(int id) {
  String endpoint = String(apiBase) + "/comando-consumido";
  String payload = String("{\"id\":") + id + "}";
  bool sucesso = enviarComRetry(endpoint, payload, 3);
  if (!sucesso) {
    Serial.println("Atenção: não foi possível marcar comando como consumido após 3 tentativas.");
    // Opcional: Adote alguma estratégia para evitar execução múltipla
  } else {
    Serial.print("Comando consumido e marcado!");
  }
}

// Inicia teste
void iniciarTeste() {
  startTimestamp = getCurrentTime();
  testRunning = true;
  startTime = millis();
  // zera dados
  for (int i = 0; i < 13; i++)
    for (int j = 0; j < numCopos; j++)
      temperatureData[i][j] = 0;
  Serial.println("Teste iniciado! (usuário_id: " + String(usuarioId) + ")");
}

// Consulta horário na worldtimeapi
String getCurrentTime() {
  HTTPClient http;
  http.begin("http://worldtimeapi.org/api/timezone/America/Sao_Paulo");
  int code = http.GET();
  String out = "";
  if (code == 200) {
    String response = http.getString();
    int startIdx = response.indexOf("\"datetime\":\"") + 11;
    int endIdx = response.indexOf("\",", startIdx);
    out = response.substring(startIdx, endIdx);
  }
  http.end();
  return out;
}

// Envia os dados do teste, com retentativas em caso de erro
void enviarDados() {
  String endpoint = String(apiBase) + "/resultadosTestes";

  for (int i = 0; i < numCopos; i++) {
    float t0 = temperatureData[0][i];        // Temperatura ao iniciar
    float tFinal = temperatureData[12][i];   // Temperatura após 120 min
    float tempAmbiente = 25.0;               // Definir conforme ambiente real!
    float tempoHoras = 2.0;                  // 120 min = 2 horas

    float k = calcularK(t0, tFinal, tempAmbiente, tempoHoras);

    String payload = "{";
    payload += "\"usuario_id\":" + String(usuarioId) + ",";
    payload += "\"copo_id\":" + String(coposIds[i]) + ",";
    payload += "\"tipo\":\"" + tipoTeste + "\",";
    payload += "\"data_inicio\":\"" + startTimestamp + "\",";
    payload += "\"data_fim\":\"" + getCurrentTime() + "\",";
    // Adicionar os tempos sem vírgula extra no final
    for (int j = 0; j < 13; j++) {
      payload += "\"t" + String(j * 10) + "\":" + String(temperatureData[j][i]);
      if (j < 12) payload += ",";
    }
    payload += ",\"k\":" + String(k, 6);  // vírgula antes do k, pois sempre teremos campos t0..t120
    payload += "}";

    bool sucesso = enviarComRetry(endpoint, payload, 3);
    if (!sucesso) {
      Serial.printf("\nFalha no envio após 3 tentativas para o copo %d (%d).\n", i+1, coposIds[i]);
      // Opcional: guardar localmente, tentar depois, etc.
    } else {
      Serial.printf("\nResultado do copo %d (%d) enviado com sucesso.\n", i+1, coposIds[i]);
    }
  }
}
