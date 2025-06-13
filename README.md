# 🧊 ThermoTrack: Sistema de Monitoramento de Copos Térmicos 🔥

![Status](https://img.shields.io/badge/status-ativo-success)
![Versão](https://img.shields.io/badge/version-1.0.0-blue)

O ThermoTrack é um projeto completo de Internet das Coisas (IoT) que monitora, analisa e apresenta a performance de copos térmicos. A solução engloba desde a captura de dados de temperatura por um sensor até a visualização em dashboards web e mobile.
---

## 🚀 Sobre o Projeto

O objetivo do ThermoTrack é oferecer uma solução completa para testar a eficiência de diferentes modelos de copos térmicos. Utilizando um sensor de temperatura, os dados são enviados para uma API central que alimenta uma aplicação web, um aplicativo mobile e um dashboard de análise de dados, permitindo aos usuários cadastrar copos e visualizar seu desempenho em tempo real.

---
## ✨ Recursos

* 🌡️ **Coleta de Dados via IoT:** Captura de temperatura em tempo real.
* ☁️ **API Centralizada:** Gerencia usuários, copos, bebidas e leituras de temperatura de forma segura.
* 💻 **Aplicação Web:** Permite que usuários se cadastrem, façam login e gerenciem seus copos térmicos.
* 📊 **Dashboard Interativo:** Visualização gráfica da variação de temperatura dos copos, com filtros dinâmicos.
* 📱 **Aplicativo Mobile:** Acesso às funcionalidades do sistema na palma da mão.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando uma variedade de tecnologias modernas, divididas por área:
<div>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/styled--components-DB7093?style=for-the-badge&logo=styled-components&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white" />
  <img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</div>

#### **Back-end (API)**

* **Runtime:** Node.js
* **Framework:** Express.js
* **ORM:** Sequelize
* **Banco de Dados:** SQLite
* **Autenticação:** JSON Web Token (JWT)
* **Segurança:** Bcrypt, Helmet, Express Rate Limit

#### **Front-end (Aplicação Web)**

* **Framework:** React
* **Roteamento:** React Router
* **Cliente HTTP:** Axios
* **Estilização:** Styled Components
* **Notificações:** React Toastify

#### **Data Science (Dashboard)**

* **Linguagem:** Python
* **Framework de Dashboard:** Streamlit
* **Manipulação de Dados:** Pandas
* **Visualização de Dados:** Plotly Express

#### **Mobile**

* **Framework:** React Native
* **Cliente HTTP:** Axios

#### **Implantação**

* **Infraestrutura:** Máquina Virtual (VM)
* **Servidor Web:** Nginx
* **Gerenciador de Processos:** PM2 / Systemd

---

## 🌐 Como Acessar

Você pode acessar as aplicações online através dos seguintes links:

### **Website ThermoTrack**

* **Link:** [http://13.68.97.186/](http://13.68.97.186/)
* **Descrição:** Acesse para se cadastrar, fazer login e gerenciar seus copos.

### **Dashboard de Análise**

* **Link:** [http://13.68.97.186:8501/](http://13.68.97.186:8501/)
* **Descrição:** O dashboard exibe os gráficos de desempenho dos copos cadastrados. Ele recebe os parâmetros do copo e da bebida diretamente na URL.
* **Exemplo de Acesso Parametrizado:** Para ver o desempenho de um copo **Stanley** com bebida **Quente**, use o link:
    [http://13.68.97.186:8501/?copo=Stanley&bebida=Quente](http://13.68.97.186:8501/?copo=Stanley&bebida=Quente)

---

## 📂 Estrutura do Repositório

Este é um monorepositório, contendo todos os projetos relacionados à solução ThermoTrack em uma única base de código.
```
/
├── API/                # Projeto do Back-end em Node.js
├── Data/               # Projeto do Dashboard em Python/Streamlit
├── IoT/                # Código para o dispositivo de IoT
├── Mobile/             # Aplicativo mobile em React Native
└── Web/                # Aplicação web em React
└── Apresentacao.pdf/
```
![Captura de tela de 2025-06-13 16-16-56](https://github.com/user-attachments/assets/8207a6af-0ab2-4138-9971-d6fc0039e1c8)

---

## 🔬 Metodologia

### 🔧 Configuração dos Testes

* **Copos Testados**: Stanley, Coleman, iKEG e Réplica.
* **Bebidas**: Água quente (\~85 °C) e água fria (\~5 °C).
* **Temperatura Ambiente**: Constante a 25 °C.
* **Volume de Líquido**: Padronizado para todos os testes.
* **Medições**: Temperatura registrada a cada 10 minutos, durante 2 horas (total de 120 minutos).
* **Testes por Copo**: 5 com bebida quente e 5 com bebida fria, totalizando 10 testes por copo.

### 📈 Modelagem Matemática

Utilizamos uma função exponencial para modelar a variação de temperatura ao longo do tempo:

$$
T(t) = 25 + (T_0 - 25) \cdot e^{-k t}
$$

Onde:

* $T(t)$: Temperatura no tempo $t$.
* $T_0$: Temperatura inicial da bebida.
* $k$: Coeficiente de perda de calor (menor valor indica melhor isolamento).

### 🧪 Análises Estatísticas

* **Regressão Exponencial**: Estimativa do coeficiente $k$ para cada teste.
* **Distribuições Estatísticas**:
  * *Normal*: Temperaturas iniciais e ruídos de medição.
  * *Binomial*: Sucesso em manter a temperatura acima/abaixo de um limiar.
  * *Uniforme*: Seleção aleatória de copos e introdução de ruído uniforme.
* **Correlação e Regressão Linear**: Relação entre temperatura inicial e tempo para atingir 25 °C.

## 📊 Visualizações

As visualizações geradas incluem:

1. **Curvas de Regressão Exponencial**: Comparação entre dados observados e modelo ajustado.
2. **Dispersão T₀ vs. Tempo para 25 °C**: Análise da correlação entre temperatura inicial e tempo para atingir a temperatura ambiente.
3. **Histogramas de Tempo para 25 °C**: Distribuição dos tempos estimados por tipo de copo.
4. **Boxplots de Temperatura Final (T120)**: Comparação da eficiência térmica entre copos.
5. **Intervalos de Confiança**: Visualização dos ICs de 95% para as médias de temperatura final.
6. **Taxas de Sucesso Binomial**: Proporção de testes em que os copos mantiveram a temperatura desejada.

*Exemplos de gráficos podem ser encontrados na pasta `Data/`.*

---

## 👥 Equipe
Este projeto foi idealizado e desenvolvido por:

👨‍💻 Danilo Benedette — Provisionamento de Servidor Web e API DataBase | [LinkedIn](https://www.linkedin.com/in/danilo-benedetti-98161436b) · [GitHub](https://github.com/DanBenedetti) 

👨‍💻 Gustavo Santos— Interface Web e Dashboard | [LinkedIn](https://www.linkedin.com/in/gustavo-moreira-santos-628857243/) · [GitHub](https://github.com/GustavoMSantoss)

👨‍💻 Thiago Resende — Modelagem Estatística, QA e Documentação | 
[LinkedIn](https://www.linkedin.com/in/thiagodiasresende/) · [GitHub](https://github.com/ThiagoResende88) 

👨‍💻 Wilton Monteiro — Interface Mobile e UX Geral | [LinkedIn](https://www.linkedin.com/in/wilton-monteiro-resende-415631287/) · [GitHub](https://github.com/Wilton-Monteiro)



## 📚 Referências

* [Documentação do Streamlit](https://docs.streamlit.io/)
* [SciPy - Statistical Functions](https://docs.scipy.org/doc/scipy/reference/stats.html)
* [Pandas - Data Analysis Library](https://pandas.pydata.org/)

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

[ThermoTrack](https://github.com/ThiagoResende88/ThermoTrack)
