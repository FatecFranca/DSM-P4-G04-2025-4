# ThermoTrack (Mobile)

## Sobre o projeto

ThermoTrack é uma aplicação mobile que permite comparar o desempenho térmico de diferentes copos térmicos, como o Stanley e seus genéricos. O objetivo é avaliar quanto tempo a temperatura inicial do líquido é mantida em cada copo, usando sensores IoT para monitoramento em tempo real.

Os dados de temperatura são coletados automaticamente e enviados para a aplicação, onde são armazenados e analisados para gerar rankings e históricos detalhados.

---

## Funcionalidades

- Cadastro de copos térmicos para teste, incluindo nome, marca e capacidade.
- Registro automático da temperatura inicial do líquido ao iniciar um teste.
- Monitoramento da temperatura em intervalos regulares (ex: a cada 10 minutos).
- Encerramento automático do teste após 2 horas.
- Ranking dos copos baseado no tempo que mantiveram a temperatura.
- Histórico de testes realizados para cada copo, armazenado em banco de dados.
- Visualização dos dados através de um Dashboard integrado (web e mobile).

---

## Tecnologias utilizadas

- HTML
- CSS
- JavaScript
- React Native
- Expo

---

## Como usar


1. Clone este repositório:
   ```bash
   git clone https://github.com/seu-usuario/thermotrack-mobile.git
2. cd thermotrack-mobile
3.npm install
npm start

Obs:A aplicação depende de uma API privada que conecta ao banco de dados. Essa API deve estar devidamente inicializada e funcionando para que o aplicativo opere normalmente.

