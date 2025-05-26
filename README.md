# 🧊 ThermoTrack: Análise Estatística de Copos Térmicos

Este projeto analisa o desempenho térmico de diferentes copos térmicos, incluindo marcas renomadas e réplicas de qualidade inferior. Utilizamos modelagem matemática e técnicas estatísticas para avaliar a eficiência de isolamento térmico de cada copo, considerando bebidas quentes e frias em ambiente controlado.

## 📁 Estrutura do Projeto

* `Data/`: Contém a planilha CSV com os dados dos testes.
* `Scripts/`: Scripts Python utilizados para as análise dos dados e testes estatísticos.
* `Visualizations/`: Gráficos gerados para ilustrar os resultados das análises.
* `README.md`: Documentação do projeto.

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
* **Intervalos de Confiança**: Cálculo de ICs de 95% para métricas relevantes.
* **Testes de Hipótese**: Comparações entre copos utilizando testes t e ANOVA.

## 📊 Visualizações

As visualizações geradas incluem:

1. **Curvas de Regressão Exponencial**: Comparação entre dados observados e modelo ajustado.
2. **Dispersão T₀ vs. Tempo para 25 °C**: Análise da correlação entre temperatura inicial e tempo para atingir a temperatura ambiente.
3. **Histogramas de Tempo para 25 °C**: Distribuição dos tempos estimados por tipo de copo.
4. **Boxplots de Temperatura Final (T120)**: Comparação da eficiência térmica entre copos.
5. **Intervalos de Confiança**: Visualização dos ICs de 95% para as médias de temperatura final.
6. **Taxas de Sucesso Binomial**: Proporção de testes em que os copos mantiveram a temperatura desejada.

*Exemplos de gráficos podem ser encontrados na pasta `Visualizations/`.*

## 🧪 Resultados Destacados

* **Stanley** apresentou o menor coeficiente $k$, indicando superior isolamento térmico.
* **Réplica** tive desempenho significativamente inferior, com maiores perdas de calor.
* Correlação positiva moderada entre temperatura inicial e tempo para atingir 25 °C.
* Diferenças estatisticamente significativas entre copos confirmadas por testes t (p < 0.001).

## 🛠️ Como Executar

1. Clone o repositório:

   ```bash
   git clone https://github.com/ThiagoResende88/ThermoTrack.git
   ```
2. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```
3. Execute os scripts de simulação e análise:

   ```bash
   python Scripts/simulate_data.py
   python Scripts/analyze_data.py
   ```

## 📈 Dashboard Interativo

Para uma visualização interativa dos resultados, utilize o dashboard desenvolvido com Streamlit:

```bash
streamlit run Scripts/dashboard.py
```

*O dashboard permite explorar os dados de forma dinâmica, com filtros por tipo de copo, bebida e métricas específicas.*

## 👥 Equipe
Este projeto foi idealizado e desenvolvido por:

👨‍💻 Danilo Benedette — Provisionamento de Servidor Web e API DataBase | LinkedIn · GitHub 

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
