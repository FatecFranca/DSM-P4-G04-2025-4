# Módulo IoT - ThermoTrack 🌡️

## Visão Geral
Este diretório contém as informações e os código para o componente de Internet das Coisas (IoT) do projeto ThermoTrack. O objetivo deste módulo é coletar dados de temperatura utilizando sensores ESP32 e enviá-los para a API backend para processamento e visualização.

## Hardware Utilizado
- **Microcontrolador:** ESP32
- **Sensores de Temperatura:** 3 x DS18B20 (focados em medir somente temperatura)

## Funcionalidades
- Realiza a leitura da temperatura ambiente a partir dos três sensores DS18B20.
- Os dados de temperatura são coletados e enviados para a API do ThermoTrack **a cada 10 minutos**.
- **Protocolo de Comunicação:** HTTP. Os dados são enviados via requisições HTTP para um endpoint específico na API.

## Estrutura de Dados (Exemplo de Payload HTTP)
A ideia é enviar os dados em um formato JSON, parecido com este:

```json
{
  "dispositivo_id": "ESP32_Thermo01", // Um identificador único para o seu ESP32
  "timestamp_utc": "2025-05-27T23:50:00Z", // Data e hora da leitura em UTC ( padrão ISO 8601)
  "leituras_temperatura": [
    { "sensor_id": "DS18B20_1", "temperatura_celsius": 23.5 },
    { "sensor_id": "DS18B20_2", "temperatura_celsius": 23.4 },
    { "sensor_id": "DS18B20_3", "temperatura_celsius": 23.6 }
  ],
  "temperatura_media_celsius": 23.5 // Pode ser calculado no ESP32 ou no backend
}
``` 

E aí, Thiago! Bora organizar essas paradas do seu projeto ThermoTrack! 🚀

Pelo que entendi, você quer dar um gás na documentação e preparar o terreno para as credenciais, né? Boa! Organização é chave.

Aqui estão as sugestões para os READMEs e o arquivo .env:

📁 Diretório IoT
Primeiro, vamos criar a pasta iot no seu repositório (se ainda não existir) e, dentro dela, o arquivo README.md com as infos dos seus sensores.

iot/README.md
Markdown

# Módulo IoT - ThermoTrack 🌡️

## Visão Geral
Este diretório contém as informações e, futuramente, o código para o componente de Internet das Coisas (IoT) do projeto ThermoTrack. O objetivo deste módulo é coletar dados de temperatura utilizando sensores ESP32 e enviá-los para a API backend para processamento e visualização.

## Hardware Utilizado
- **Microcontrolador:** ESP32
- **Sensores de Temperatura:** 3 x DS18B20 (focados em medir somente temperatura)

## Funcionalidades
- Realiza a leitura da temperatura ambiente a partir dos três sensores DS18B20.
- Os dados de temperatura são coletados e enviados para a API do ThermoTrack **a cada 10 minutos**.
- **Protocolo de Comunicação:** HTTP. Os dados são enviados via requisições HTTP para um endpoint específico na API.

## Estrutura de Dados (Exemplo de Payload HTTP)
A ideia é enviar os dados em um formato JSON, parecido com este:

```json
{
  "dispositivo_id": "ESP32_Thermo01", // Um identificador único para o seu ESP32
  "timestamp_utc": "2025-05-27T23:50:00Z", // Data e hora da leitura em UTC ( padrão ISO 8601)
  "leituras_temperatura": [
    { "sensor_id": "DS18B20_1", "temperatura_celsius": 23.5 },
    { "sensor_id": "DS18B20_2", "temperatura_celsius": 23.4 },
    { "sensor_id": "DS18B20_3", "temperatura_celsius": 23.6 }
  ],
  "temperatura_media_celsius": 23.5 // Pode ser calculado no ESP32 ou no backend
}
```

## Configuração e Uso (Diretrizes Gerais)
1. Ambiente ESP32:
- Configure o ambiente de desenvolvimento para o ESP32 (ex: Arduino IDE com o board manager do ESP32, ou PlatformIO).
- Instale as bibliotecas necessárias: OneWire (para comunicação com DS18B20), DallasTemperature (para ler a temperatura dos DS18B20), WiFi (para conectar à rede), e uma biblioteca para requisições HTTP (ex: HTTPClient).

2. Código do ESP32:
- No código, configure as credenciais da rede Wi-Fi (SSID e senha).
- Defina o endereço do endpoint da API para onde os dados de temperatura serão enviados (ex: http://13.68.97.186:4000/dados_iot).
- Implemente a lógica para ler os sensores, montar o JSON e enviá-lo via HTTP POST.

3. Conexão Física:
- Conecte os sensores DS18B20 aos pinos corretos do ESP32, utilizando um resistor de pull-up (geralmente 4.7kΩ) no pino de dados.

4. Deploy e Monitoramento:
- Compile e faça o upload do código para o ESP32.
- Monitore as saídas para verificar se está conectando ao Wi-Fi e enviando os dados corretamente.

