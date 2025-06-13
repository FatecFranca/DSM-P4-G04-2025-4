# Análise de Dados e Dashboard - ThermoTrack

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)
![Plotly](https://img.shields.io/badge/Plotly-3F4F75?style=for-the-badge&logo=plotly&logoColor=white)
![Scikit-learn](https://img.shields.io/badge/scikit--learn-F7931A?style=for-the-badge&logo=scikit-learn&logoColor=white)

Este diretório contém os recursos responsáveis pela análise de dados e pela visualização da performance dos copos térmicos. O coração desta pasta é um dashboard interativo criado com **Streamlit**, que permite explorar os dados coletados de forma visual e estatística.

---

## 📊 Sobre o Dashboard

O dashboard `dashboard_thermotrack.py` foi projetado para responder à pergunta principal do projeto: **Qual a eficiência térmica de um copo?**

Para isso, ele carrega os dados de medições (neste exemplo, do arquivo `copos_termicos.csv`) e aplica uma série de análises estatísticas e visualizações para avaliar como a temperatura de uma bebida varia ao longo do tempo.

### Como Funciona

1.  **Fonte de Dados:** O script lê um arquivo CSV contendo as medições de temperatura ao longo do tempo para diferentes copos e tipos de bebida (Quente/Fria).
2.  **Interface Interativa:** O usuário pode selecionar um **modelo de copo** e um **tipo de bebida** através de filtros na barra lateral.
3.  **Geração de Análise:** Ao clicar em "Gerar Gráfico", o dashboard filtra os dados correspondentes e exibe um relatório completo de performance.
4.  **Acesso via URL:** O dashboard também pode ser acessado com os filtros pré-selecionados através de parâmetros na URL. Por exemplo: `/?copo=Stanley&bebida=Quente`.

---

## 📈 Visualizações e Análises

O dashboard apresenta a análise de performance em várias seções:

### 1. Métricas Principais

Logo no topo, são exibidos quatro cartões com os indicadores mais importantes do teste:

* **Temperatura Inicial:** A temperatura registrada no primeiro minuto do teste ($T_0$).
* **Temperatura Final:** A temperatura registrada no último minuto do teste ($T_f$).
* **Variação de Temperatura:** A diferença total de temperatura ($\Delta T = T_f - T_0$), indicando o quanto a temperatura mudou.
* **Tempo de Análise:** A duração total do experimento em minutos.

### 2. Gráfico de Desempenho Térmico

Este é o principal gráfico da análise. Um **gráfico de linha** que mostra a curva de decaimento (ou aquecimento) da temperatura ao longo do tempo.

* **Eixo X:** Tempo (em minutos).
* **Eixo Y:** Temperatura (em °C).

Ele permite visualizar de forma clara e intuitiva a taxa com que o copo perde ou ganha calor. Uma curva mais "plana" indica uma melhor performance térmica.

### 3. Análise Estatística Descritiva

Para uma visão mais aprofundada dos dados, uma tabela de estatística descritiva é apresentada. Ela resume a distribuição dos pontos de temperatura coletados:

* **count:** Número total de medições.
* **mean:** A média de temperatura durante o teste.
* **std:** O desvio padrão, que indica a dispersão das temperaturas em torno da média.
* **min, 25%, 50% (mediana), 75%, max:** Os quartis, que dividem os dados de temperatura em quatro partes iguais, ajudando a entender a distribuição e a centralidade dos dados.

### 4. Diagrama de Caixa (Box Plot)

O Box Plot complementa a análise descritiva, mostrando visualmente a distribuição da temperatura. Ele é excelente para:
* Identificar a **mediana** (a linha central no retângulo).
* Visualizar o **intervalo interquartil** (a "caixa"), onde se concentram 50% dos dados.
* Detectar **outliers** (pontos fora das "hastes"), que podem indicar medições anômalas.

### 5. Modelo de Regressão Linear

Esta é a análise mais avançada do dashboard. Um **modelo de regressão linear** é treinado para encontrar a relação matemática entre o tempo e a temperatura.

* **Objetivo:** Criar uma equação que descreva a tendência de queda (ou aumento) da temperatura.
* **Visualização:** Um gráfico de dispersão com os pontos de dados reais e uma linha vermelha que representa a previsão do modelo.
* **A Equação do Modelo:** O dashboard exibe a equação da reta no formato:
    $$ \text{Temperatura} = (a \times \text{Tempo}) + b $$
    Onde:
    * **`a` (coeficiente angular):** É o indicador mais importante. Representa a **taxa de variação da temperatura** por minuto. Para bebidas quentes, um valor de `a` mais próximo de zero significa que o copo é mais eficiente (perde menos calor).
    * **`b` (intercepto):** O valor teórico da temperatura no instante zero, segundo o modelo.
* **R-quadrado ($R^2$):** Este valor, que varia de 0 a 1, indica o quão bem o modelo linear se ajusta aos dados. Um $R^2$ próximo de 1 (ex: 0.98) significa que a variação da temperatura ao longo do tempo é muito bem explicada por uma reta, tornando o modelo confiável.

### 6. Previsão de Temperatura

Utilizando a equação do modelo de regressão, o dashboard oferece uma ferramenta de previsão. O usuário pode inserir um valor de tempo (em minutos) e o modelo calculará qual a temperatura **estimada** para aquele instante futuro.

---

## 🚀 Como Executar Localmente

Para rodar este dashboard em sua máquina, siga os passos:

1.  **Pré-requisitos:** Certifique-se de ter o Python 3.8+ instalado.

2.  **Navegue até a pasta:**
    ```bash
    cd Data/
    ```

3.  **Crie e ative um ambiente virtual (recomendado):**
    ```bash
    # Criar o ambiente
    python -m venv venv

    # Ativar no Windows
    .\venv\Scripts\activate

    # Ativar no Linux/macOS
    source venv/bin/activate
    ```

4.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Execute o dashboard:**
    ```bash
    streamlit run dashboard_thermotrack.py
    ```

O dashboard será aberto automaticamente em uma nova aba do seu navegador.

Imagens:
![image](https://github.com/user-attachments/assets/d3229f89-bf58-4b76-ae9a-74d458b4d6c7)
![image](https://github.com/user-attachments/assets/dd75974e-84f4-4c99-9a00-6eb9a23411d7)
![image](https://github.com/user-attachments/assets/163dddca-5327-4ef7-a1c8-fe583f6f830d)
![image](https://github.com/user-attachments/assets/c876fb63-aded-4ede-a3a1-062a08b849ce)
![image](https://github.com/user-attachments/assets/81980021-1ca8-4401-9eba-b7acc12010c0)
![image](https://github.com/user-attachments/assets/52cb62a4-b401-491c-93ce-e24bb01223e2)
