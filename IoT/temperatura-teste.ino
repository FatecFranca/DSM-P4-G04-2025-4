#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>

// Configurações de conexão Wi-Fi
const char* ssid = "Poco X6 Pro 5G"; // Nome da rede
const char* password = "12345678";   // Senha da rede

// Data wire is connected to GPIO15
#define ONE_WIRE_BUS 15

// Setup a OneWire instance to communicate with a OneWire device
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Endereços dos sensores
DeviceAddress sensor1 = { 0x28, 0x36, 0xDD, 0x35, 0x0, 0x0, 0x0, 0x3A };
DeviceAddress sensor2 = { 0x28, 0xAE, 0xF, 0x59, 0x0, 0x0, 0x0, 0x75 };
DeviceAddress sensor3 = { 0x28, 0x7F, 0x47, 0xCB, 0x57, 0x23, 0xB, 0x2 };

// Variáveis para armazenar o estado de cada copo
bool testStarted1 = false;
bool testStarted2 = false;
bool testStarted3 = false;

// Temperaturas alvo
const float targetHotTemp = 85.0;
const float targetColdTemp = 2.0;

// Threshold
const float threshold = 0.1;

void setup(void) {
  Serial.begin(115200);

  // Conexão Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando ao WiFi...");
  }
  Serial.println("Conectado ao WiFi");

  sensors.begin();
}

void loop(void) {
  // Solicita temperaturas
  sensors.requestTemperatures(); 
  Serial.println("Temperaturas requisitadas:");

  float temp1 = sensors.getTempC(sensor1);
  float temp2 = sensors.getTempC(sensor2);
  float temp3 = sensors.getTempC(sensor3);
    
  Serial.print("Sensor 1 (*C): ");
  Serial.println(temp1);
  Serial.print("Sensor 2 (*C): ");
  Serial.println(temp2);
  Serial.print("Sensor 3 (*C): ");
  Serial.println(temp3);

  // Verificação da temperatura para Copo 1
  if (!testStarted1) {
    if ((temp1 >= targetHotTemp - threshold && temp1 <= targetHotTemp + threshold) ||
        (temp1 <= targetColdTemp + threshold && temp1 >= targetColdTemp - threshold)) {
      Serial.println("Iniciando medição para Copo 1.");
      testStarted1 = true;
      // Inicie a lógica do teste para o Copo 1 aqui
    }
  }

  // Verificação da temperatura para Copo 2
  if (!testStarted2) {
    if ((temp2 >= targetHotTemp - threshold && temp2 <= targetHotTemp + threshold) ||
        (temp2 <= targetColdTemp + threshold && temp2 >= targetColdTemp - threshold)) {
      Serial.println("Iniciando medição para Copo 2.");
      testStarted2 = true;
      // Inicie a lógica do teste para o Copo 2 aqui
    }
  }

  // Verificação da temperatura para Copo 3
  if (!testStarted3) {
    if ((temp3 >= targetHotTemp - threshold && temp3 <= targetHotTemp + threshold) ||
        (temp3 <= targetColdTemp + threshold && temp3 >= targetColdTemp - threshold)) {
      Serial.println("Iniciando medição para Copo 3.");
      testStarted3 = true;
      // Inicie a lógica do teste para o Copo 3 aqui
    }
  }

  delay(2000); // Aguarda 2 segundos antes da próxima leitura
}
