# Análise Estatística dos Dados de Desempenho dos Copos Térmicos

Para este projeto, definimos cinco tipos de copos — *Copo Stanley*, dois concorrentes (*Coleman*, *iKEG*) e duas réplicas de qualidade inferior (*Réplica A*, *Réplica B*). Em cada teste, registra-se o tipo de bebida (quente ou fria), a temperatura inicial e medições de temperatura a cada 10 minutos por 2 horas (até 120 min). Assumimos **volume padronizado de água** e temperatura ambiente constante de 25 °C. Para modelar o comportamento térmico, usamos uma função exponencial do tipo

$$
T(t) = 25 + (T_0 - 25) \, e^{-k t},
$$

onde $T_0$ é a temperatura inicial e $k$ é o coeficiente de perda de calor (menor para melhor isolamento). Definimos $k$ baixo para o Stanley (bom isolamento) e maior para as réplicas (piores). Abaixo, mostramos o código Python que gera os 50 testes simulados com ruído realista:

## A [planilha CSV](https://github.com/ThiagoResende88/ThermoTrack/blob/main/Data/copos_termicos.csv) contém o resultado dos testes feitos e está estruturada com asseguintes colunas:

* **Copo:** Nome do copo (Stanley, Coleman, IKEG, Réplica A/B).
* **Teste:** Identificador do teste (1–10).
* **Bebida:** Quente ou Fria.
* **T0:** Temperatura inicial da bebida (°C).
* **T10, T20, …, T120:** Leituras de temperatura a cada 10 minutos.
* **Perda\_media\_10min:** Variação média de temperatura (°C) por intervalo de 10 minutos.
* **Tempo\_1Grau:** Tempo estimado (min) para chegar a \~26°C (ou \~24°C) pelo ajuste exponencial.

## Testes Estatísticos 

### Regressão Exponencial e Projeção de Tempo

Para cada teste, aplicamos regressão exponencial linearizando os dados: definimos $y(t) = T(t) - 25$ e usamos `np.polyfit` em $\ln|y|$ vs $t$ para estimar $k$. Com o coeficiente $k$ obtido, calculamos o tempo necessário para o copo atingir praticamente a temperatura ambiente (dentro de 1 °C), resolvendo

$$
\lvert T(t) - 25\rvert = 1^\circ{\rm C} \implies t = \frac{\ln(|T_0 - 25|/1)}{k}.
$$

Essa projeção aparece na coluna `Tempo_1Grau`. O ajuste exponencial descreve bem o isolamento térmico: copos com menor $k$ (ex. Stanley) demoram muito mais para igualar 25 °C. Abaixo mostramos um gráfico de dispersão que ilustra a correlação entre a temperatura inicial e o tempo estimado para atingir 25 °C; nota-se correlação positiva (quanto maior $T_0$, maior o tempo).

    **![GRÁFICO EXEMPLO]**

### Análise de Distribuições

Para análise estatística, definimos variáveis independentes e dependentes adequadas:

* **Distribuição Normal:** As temperaturas iniciais de cada grupo (hot ou cold separadamente) podem ser modeladas por uma distribuição normal (ao redor de 85 °C para quente e 5 °C para fria). Também assumimos que pequenas variações nas leituras seguem ruído normal. Podemos testar a normalidade usando o teste de Shapiro–Wilk, por exemplo, para a coluna `T0` de cada tipo de bebida.
* **Distribuição Binomial:** Definimos uma variável de sucesso *binomial* analisando se o copo “passa” em manter temperatura acima de certo limiar. Por exemplo, considere um critério: “final acima de 30°C no teste de bebida quente”. Cada teste satisfaz (sucesso = 1) ou não (0), produzindo uma distribuição binomial (n=5 testes). Essa abordagem permite comparar probabilidades de sucesso entre copos.
* **Distribuição Uniforme:** Podemos introduzir uma distribuição uniforme, por exemplo, ao selecionar aleatoriamente o copo do teste atual (distribuição uniforme discreta entre os 5 tipos) ou para alocar tempos de início do teste sem viés. Ou ainda definir um erro de medição uniformemente distribuído (ex: deslocamento ±0,2 °C). Isso ilustra variáveis uniformes no experimento.

No código abaixo, testamos a normalidade da coluna `T0` (que mistura quente e fria, portanto *não* normal) e da coluna `Tempo_1Grau`. Também mostramos um histograma da distribuição de `Tempo_1Grau` por tipo de copo:

```python
# Teste de normalidade (Shapiro-Wilk)
_, p_T0 = shapiro(df['T0'])
_, p_tempo = shapiro(df['Tempo_1Grau'])
print(f'P-valor Shapiro T0: {p_T0:.3f}, Tempo_1Grau: {p_tempo:.3f}')
```

O histograma abaixo exibe as distribuições do tempo estimado até 25°C por copo. Nota-se que o *Stanley* (laranja) tem tempos muito maiores (indica melhor isolamento), enquanto as réplicas (rosa e azul claro) têm tempos bem menores.

    **[HISTOGRAMA]**

### Correlação e Regressão

Além do modelo exponencial, exploramos correlações lineares. Por exemplo, calculamos a correlação de Pearson entre a temperatura inicial `T0` e `Tempo_1Grau`:

```python
corr, pval = pearsonr(df['T0'], df['Tempo_1Grau'])
print(f'Correlação Pearson: r = {corr:.3f}, p = {pval:.3f}')
```

Encontramos correlação moderada positiva (ex.: r≈0.36, p<0.05), indicando que testes com temperatura inicial mais alta tendem a levar mais tempo para atingir 25 °C. Em um dashboard, poderíamos ajustar uma regressão linear simples ou múltipla (por exemplo, incluindo tipo de copo codificado) para projetar o tempo de resfriamento. A figura de dispersão abaixo ilustra essa relação para bebidas quentes (marcador laranja) e frias (vermelho).

    **[FIGURA]**

## Intervalos de Confiança

Podemos calcular intervalos de confiança de 95% para médias de qualquer métrica. Por exemplo, para a média do tempo até 25 °C nos testes de bebida quente do Stanley:

```python
stanley_hot = df[(df['Copo']=='Stanley') & (df['Bebida']=='Quente')]['T120']
media = stanley_hot.mean()
sd = stanley_hot.std(ddof=1)
n = len(stanley_hot)
tcrit = 2.776  # t para df=4 a 95%
ci = (media - tcrit*sd/np.sqrt(n), media + tcrit*sd/np.sqrt(n))
print(f'Média T120 (Stanley quente): {media:.1f}°C, IC95% = ({ci[0]:.1f}, {ci[1]:.1f})')
```

Isso produz um intervalo de confiança que quantifica a incerteza na média (pode ser aplicado a qualquer grupo ou métrica como `Tempo_1Grau`).

### Testes de Hipótese

Para comparar o desempenho de copos (p.ex. Stanley vs Réplicas), usamos testes de hipótese. Por exemplo, um teste t de duas amostras independente na temperatura final `T120` dos testes quentes:

```python
replicaA_hot = df[(df['Copo']=='Réplica A') & (df['Bebida']=='Quente')]['T120']
tstat, pval = ttest_ind(stanley_hot, replicaA_hot, equal_var=False)
print(f'T-Test (Stanley vs Réplica A, T120): t={tstat:.2f}, p={pval:.3e}')
```

Obtém-se p≈0 (p<0.001), indicando diferença estatisticamente significativa: o *Stanley* mantém muito mais calor que a *Réplica*. Testes ANOVA ou múltiplos testes t (com correção) podem ser aplicados para comparar vários grupos (e.g., Stanley vs Concorrentes vs Réplicas). Também é possível usar testes não-paramétricos (ex.: Wilcoxon, se a normalidade não se mantiver). Essas análises validam hipóteses como “há diferença de desempenho entre Stanley e genéricos”.

    **[DASHBOARD]**
