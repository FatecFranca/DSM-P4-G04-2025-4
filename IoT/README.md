# Módulo IoT - ThermoTrack 🌡️

## Visão Geral
Este diretório contém as informações e código para o componente de Internet das Coisas (IoT) do projeto ThermoTrack. O objetivo deste módulo é coletar e processar dados de temperatura em tempo real utilizando sensores DS18B20 conectados a um microcontrolador ESP32. Os dados de temperatura são enviados periodicamente para uma API backend para armazenamento e visualização.

## Hardware Utilizado
- **Microcontrolador:** ESP32
- **Sensores de Temperatura:** 3 x DS18B20 (focados em medir somente temperatura)

## Funcionalidades
- Realiza a leitura da temperatura dos copos a partir dos três sensores DS18B20.
- Os dados de temperatura são coletados e enviados para a API do ThermoTrack **a cada 10 minutos**.
- **Protocolo de Comunicação:** HTTP. Os dados são enviados via requisições HTTP para um endpoint específico na API.

## Estrutura de Dados (Exemplo de Payload HTTP)
Os dados são enviados em formato JSON, como ilustrado abaixo:

```json
{
  "usuario_id": 1,                    // ID do usuário que iniciou o teste
  "copo_id": 101,                     // ID do copo testado
  "tipo": "quente",                   // Tipo de teste (ex: "quente", "fria")
  "data_inicio": "2025-05-27T23:00:00Z", // Timestamp do início do teste em formato UTC
  "data_fim": "2025-05-27T23:15:00Z", // Timestamp do fim do teste em formato UTC
  "temperaturas": [
    { "tempo_minutos": 0, "temperatura_celsius": 23.5 },
    { "tempo_minutos": 10, "temperatura_celsius": 24.0 },
    { "tempo_minutos": 20, "temperatura_celsius": 25.2 }
  ],
  "k": 0.05                           // Coeficiente de decaimento de temperatura
}
```

## Configuração e Uso (Diretrizes Gerais)
1. Ambiente ESP32:
  - Configure o ambiente de desenvolvimento para o ESP32 (ex.: Arduino IDE ou PlatformIO).
  - Instale as bibliotecas necessárias: 
  
    OneWire para comunicação com sensores DS18B20.
    DallasTemperature para leitura das temperaturas.
    WiFi para conectar à rede.
    HTTPClient para requisições HTTP.
    ArduinoJson para manipulação de JSON.
    LittleFS para armazenamento de dados.

2. Código do ESP32:

 O código deve ser configurado com as credenciais da rede Wi-Fi (SSID e senha) e o endpoint da API onde os dados de temperatura serão enviados (ex:http://13.68.97.186:4000/resultadosTestes).


3. Conexão Física:
  Conecte os sensores DS18B20 aos pinos corretos do ESP32, utilizando um resistor de pull-up (4.7kΩ) no pino de dados.

4. Deploy e Monitoramento:
  - Compile e faça o upload do código para o ESP32.
  - Monitore as saídas no console para verificar a conexão Wi-Fi e o envio dos dados.

## Código Fonte

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

// Endereço e variáveis do sensor
DeviceAddress sensores[3] = {
  { 0x28, 0x36, 0xDD, 0x35, 0x0, 0x0, 0x0, 0x3A }, // Sensor 1
  { 0x28, 0xAE, 0x0F, 0x59, 0x0, 0x0, 0x0, 0x75 }, // Sensor 2
  { 0x28, 0x7F, 0x47, 0xCB, 0x57, 0x23, 0x0B, 0x02 } // Sensor 3
};

// Variáveis de estado do teste
int comandoId = -1; 
int usuarioId = -1; 
String tipoTeste; 
int coposIds[3] = {0, 0, 0}; 
int numCopos = 0; 

bool testRunning = false; 
unsigned long startTime; 
String startTimestamp; 
unsigned long lastCommandCheck = 0;
const unsigned long commandPollInterval = 5000; 
unsigned long lastPendingSendAttempt = 0;
const unsigned long pendingSendInterval = 30000; 
unsigned long lastWifiCheck = 0; 
const unsigned long wifiCheckInterval = 10000; 
bool t0_captured = false; 
int lastMinuteLogged = -1; 

// Diretório no LittleFS para armazenar dados de envio pendente
const char* PENDING_DIR = "/pending";
float temperatureData[13][3];

// Funções e lógica do código...

// Setup do ESP32
void setup() {
    // Inicialização do código
}

// Loop principal do ESP32
void loop() {
    // Lógica de repetição
}

## Considerações finais

O projeto ThermoTrack foi desenvolvido no contexto de um Projeto Interdisciplinar (PI) pelo grupo de alunos do 4º semestre do curso de Desenvolvimento de Sistemas (DSM) da Fatec de Franca, no 1º semestre de 2025.

Os membros do grupo incluem:

    Wilton Monteiro - Designer/Front-end
    Thiago Resende - Full-stack
    Danilo Benedetti - Back-end/IoT
    Gustavo Monteiro - Front-end

O objetivo do ThermoTrack é desenvolver um sistema IoT acessível por aplicações web e mobile, que tem a finalidade de testar a eficiência e o desempenho de copos térmicos. Através da coleta e análise de dados de temperatura, o projeto busca oferecer insights valiosos sobre a eficiência térmica dos produtos testados.

Estamos abertos a sugestões e colaborações para enriquecer ainda mais este projeto!