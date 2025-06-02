import streamlit as st
import pandas as pd
import os
import mysql.connector
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.optimize import curve_fit

# --- Configurações Iniciais do Streamlit ---
st.set_page_config(layout="wide", page_title="ThermoTrack Dashboard Avançado")

# --- Funções de Modelagem e Cálculo ---

def temp_model(t, k, T0, Tamb):
    """Modelo exponencial de resfriamento/aquecimento."""
    return Tamb + (T0 - Tamb) * np.exp(-k * t)

def calcular_k_coeficientes(df, t_amb):
    """
    Calcula os coeficientes k para cada medição de tempo e o k médio por teste (método pontual).
    Adiciona colunas k_estimado_regressao e tempo_ate_proximo_Tamb.
    """
    df_calculado = df.copy()
    temp_cols_measure = [col for col in df_calculado.columns if col.startswith('T') and col[1:].isdigit() and col != 'T0']
    time_points_measure = np.array([int(col[1:]) for col in temp_cols_measure])

    if not temp_cols_measure:
        st.error("Nenhuma coluna de medição de temperatura (T10, T20, etc.) encontrada.")
        return df_calculado.assign(k_medio_teste=np.nan, k_estimado_regressao=np.nan, tempo_ate_proximo_Tamb=np.nan)

    # Cálculo de k pontual
    for i, col in enumerate(temp_cols_measure):
        t = time_points_measure[i]
        T_t = df_calculado[col]
        T_0 = df_calculado['T0']
        numerador = T_0 - t_amb
        denominador = T_t - t_amb
        condicao_valida = (numerador * denominador > 0) & (denominador != 0)
        k_col_name = f'k_{col}'
        df_calculado[k_col_name] = np.where(
            condicao_valida, (1/t) * np.log(numerador / denominador), np.nan
        )

    k_cols_list = [col for col in df_calculado.columns if col.startswith('k_T')]
    if k_cols_list:
        df_calculado['k_medio_teste_pontual'] = df_calculado[k_cols_list].mean(axis=1, skipna=True)
    else:
        df_calculado['k_medio_teste_pontual'] = np.nan

    # Cálculo de k por regressão não linear e predição de tempo
    k_estimados_regressao = []
    tempos_preditos = []

    for index, row in df_calculado.iterrows():
        T0_teste = row['T0']
        temperaturas_teste = row[['T0'] + temp_cols_measure].values.astype(float)
        t_data = np.concatenate(([0], time_points_measure))

        # Remover NaNs dos dados do teste atual para o ajuste
        valid_indices = ~np.isnan(temperaturas_teste)
        t_data_fit = t_data[valid_indices]
        T_data_fit = temperaturas_teste[valid_indices]

        if len(t_data_fit) < 2: # Precisa de pelo menos 2 pontos para ajustar
            k_estimados_regressao.append(np.nan)
            tempos_preditos.append(np.nan)
            continue

        try:
            # Ajuste da curva para encontrar k
            # A função lambda precisa ter 't' como primeiro argumento
            popt, pcov = curve_fit(lambda t, k: temp_model(t, k, T0_teste, t_amb),
                                   t_data_fit, T_data_fit, p0=[0.01], maxfev=5000)
            k_reg = popt[0]
            k_estimados_regressao.append(k_reg)

            # Prever tempo para T(t) se aproximar de t_amb
            # Definir T_final como t_amb +/- 0.5°C, na direção de T0
            tolerancia = 0.5
            if T0_teste > t_amb:
                T_final_pred = t_amb + tolerancia
                if T_final_pred >= T0_teste : # Não pode prever além do T0 no sentido errado
                    tempos_preditos.append(np.nan)
                    continue
            elif T0_teste < t_amb:
                T_final_pred = t_amb - tolerancia
                if T_final_pred <= T0_teste:
                    tempos_preditos.append(np.nan)
                    continue
            else: # T0_teste == t_amb
                tempos_preditos.append(0) # Já está na temperatura ambiente
                continue

            # Garantir que o argumento do log seja válido
            arg_log = (T_final_pred - t_amb) / (T0_teste - t_amb)
            if arg_log > 0 and arg_log < 1 and k_reg > 0: # k_reg > 0 para evitar divisão por zero e ln de negativo
                tempo_p = (-1/k_reg) * np.log(arg_log)
                tempos_preditos.append(tempo_p)
            else:
                tempos_preditos.append(np.nan)

        except (RuntimeError, ValueError) as e: # Erro no ajuste ou valor inválido
            #st.sidebar.warning(f"Não foi possível estimar k por regressão para o teste {index}. Erro: {e}")
            k_estimados_regressao.append(np.nan)
            tempos_preditos.append(np.nan)


    df_calculado['k_estimado_regressao'] = k_estimados_regressao
    df_calculado['tempo_para_prox_Tamb'] = tempos_preditos
    return df_calculado

# --- Funções de Plotagem (algumas podem ser reutilizadas e adaptadas) ---
def plotar_curvas_temperatura_filtrado(df_plot, t_amb, temp_data_cols):
    if df_plot.empty:
        st.info("Nenhum dado para plotar as curvas de temperatura com os filtros atuais.")
        return

    plt.figure(figsize=(10, 6))
    for i, row in df_plot.iterrows():
        label = f"Copo: {row['Copo']}, Teste: {row['Teste']}"
        temperaturas = row[temp_data_cols].values
        tempo = np.array([0] + [int(col[1:]) for col in temp_data_cols if col !='T0'])
        # Garantir que tempo e temperaturas tenham o mesmo comprimento
        if len(tempo) == len(temperaturas):
             sns.lineplot(x=tempo, y=temperaturas, label=label, marker='o')
        else:
            st.warning(f"Inconsistência de dados para o teste {row['Teste']} do copo {row['Copo']}. Pulando plot da curva.")

    plt.axhline(t_amb, color='gray', linestyle='--', label=f'Temp. Ambiente ({t_amb}°C)')
    plt.title(f'Curvas de Temperatura para: {df_plot["Copo"].iloc[0]} - Bebida: {df_plot["Bebida"].iloc[0]}')
    plt.xlabel('Tempo (minutos)')
    plt.ylabel('Temperatura (°C)')
    plt.legend(loc='upper right', bbox_to_anchor=(1.35, 1.0)) # Ajustar legenda
    plt.grid(True)
    st.pyplot(plt.gcf()) # Passar a figura atual
    plt.clf() # Limpar a figura para o próximo plot

def plotar_distribuicao_k(df_plot, k_column_name, copo_selecionado):
    if df_plot.empty or k_column_name not in df_plot.columns:
        st.info(f"Não há dados de '{k_column_name}' para o copo {copo_selecionado} para plotar a distribuição.")
        return
    plt.figure(figsize=(8, 5))
    sns.histplot(df_plot[k_column_name].dropna(), kde=True)
    plt.title(f'Distribuição de {k_column_name} para {copo_selecionado}')
    plt.xlabel(k_column_name)
    plt.ylabel('Frequência')
    st.pyplot(plt.gcf())
    plt.clf()

def plotar_heatmap_correlacao(df_corr):
    if df_corr.empty:
        st.info("Não é possível gerar heatmap de correlação com dados vazios.")
        return
    plt.figure(figsize=(10, 8))
    # Selecionar apenas colunas numéricas para correlação
    numeric_cols = df_corr.select_dtypes(include=np.number).columns
    if len(numeric_cols) < 2:
        st.info("Poucas colunas numéricas para gerar um heatmap de correlação significativo.")
        return

    correlation_matrix = df_corr[numeric_cols].corr()
    sns.heatmap(correlation_matrix, annot=True, fmt=".2f", cmap="coolwarm", linewidths=.5)
    plt.title('Heatmap de Correlação entre Variáveis')
    st.pyplot(plt.gcf())
    plt.clf()

# --- Função para Conectar ao Banco de Dados ---
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.environ.get('DB_HOST_DASHBOARD', 'localhost'), # Pega do ambiente ou usa 'localhost'
            user=os.environ.get('DB_USER_DASHBOARD', 'seu_usuario_bd'),
            password=os.environ.get('DB_PASSWORD_DASHBOARD', 'sua_senha_bd'),
            database=os.environ.get('DB_NAME_DASHBOARD', 'thermotrack_db')
        )
        return conn
    except mysql.connector.Error as err:
        st.error(f"Erro ao conectar ao banco de dados: {err}")
        return None

# --- Função para Carregar Dados do Banco ---
def carregar_dados_do_banco():
    conn = get_db_connection()
    if conn:
        try:
            # Adapte esta query para sua estrutura de tabelas e colunas!
            query = "SELECT Copo, Teste, Bebida, T0, T10, T20, T30, T40, T50, T60 FROM sua_tabela_de_medicoes"
            df = pd.read_sql(query, conn)
            conn.close()
            return df
        except Exception as e:
            st.error(f"Erro ao executar a query no banco: {e}")
            return pd.DataFrame() # Retorna DataFrame vazio em caso de erro
    return pd.DataFrame()

# --- Interface do Streamlit ---
st.title("🌡️ ThermoTrack - Dashboard de Análise Detalhada")
t_ambiente= 25.0

# --- Funçao para carregamento de arquivos CSV local ---
# Sidebar para configurações e upload
# st.sidebar.header("Configurações e Upload")
# uploaded_file = st.sidebar.file_uploader("Carregue seu arquivo CSV", type=["csv"])
# t_ambiente = st.sidebar.number_input("Temperatura Ambiente (°C)", value=t_ambiente_default, format="%.1f")


# Carregar dados
df_original = carregar_dados_do_banco()
if df_original.empty and not any(st.session_state.get(key, {}).get('type') == 'error' for key in st.session_state): # Evitar múltiplas msgs de erro
    st.warning("Nenhum dado foi carregado do banco de dados. Verifique a conexão e se há dados na tabela.")
elif not df_original.empty:
    st.success("Dados carregados do banco com sucesso!")

if df_original is not None:
    # Validar colunas básicas
    colunas_obrigatorias = ['Copo', 'Teste', 'Bebida', 'T0']
    colunas_temperatura = [col for col in df_original.columns if col.startswith('T') and col[1:].isdigit() and col != 'T0']

    if not all(col in df_original.columns for col in colunas_obrigatorias) or not colunas_temperatura:
        st.error("O arquivo CSV deve conter as colunas 'Copo', 'Teste', 'Bebida', 'T0' e colunas de medição de temperatura (ex: T10, T20...).")
    else:
        df_processado = calcular_k_coeficientes(df_original, t_ambiente)

        st.header("Filtros e Dados dos Testes")
        
        col_filtro1, col_filtro2 = st.columns(2)
        copos_disponiveis = sorted(df_processado['Copo'].unique())
        copo_selecionado = col_filtro1.selectbox("Selecione o Copo:", copos_disponiveis)

        bebidas_disponiveis = sorted(df_processado['Bebida'].unique())
        bebida_selecionada = col_filtro2.selectbox("Selecione o Tipo de Bebida:", bebidas_disponiveis)

        df_filtrado_usuario = df_processado[
            (df_processado['Copo'] == copo_selecionado) &
            (df_processado['Bebida'] == bebida_selecionada)
        ]

        if df_filtrado_usuario.empty:
            st.warning("Nenhum dado encontrado para os filtros selecionados.")
        else:
            st.subheader(f"Dados Detalhados para: {copo_selecionado} - Bebida: {bebida_selecionada}")
            cols_to_display = ['Teste', 'T0'] + colunas_temperatura + \
                              [col for col in df_processado.columns if col.startswith('k_T')] + \
                              ['k_medio_teste_pontual', 'k_estimado_regressao', 'tempo_para_prox_Tamb']
            st.dataframe(df_filtrado_usuario[cols_to_display].style.format(precision=4))

            st.subheader("Curvas de Temperatura dos Testes Filtrados")
            temp_data_cols_plot = ['T0'] + colunas_temperatura
            plotar_curvas_temperatura_filtrado(df_filtrado_usuario, t_ambiente, temp_data_cols_plot)


        st.header("Análises Estatísticas Avançadas")

        # Abas para diferentes análises
        tab1, tab2, tab3, tab4 = st.tabs(["Distribuições e IC", "Testes de Hipótese", "Correlações", "Predição (Regressão)"])

        with tab1:
            st.subheader(f"Análise de Distribuição e IC para '{copo_selecionado}' ({bebida_selecionada})")
            if not df_filtrado_usuario.empty:
                # Usar k_estimado_regressao se disponível e não todo NaN, senão usar k_medio_teste_pontual
                k_col_analise = 'k_estimado_regressao'
                if df_filtrado_usuario[k_col_analise].isnull().all():
                    k_col_analise = 'k_medio_teste_pontual'
                
                st.write(f"Analisando coluna: **{k_col_analise}**")
                plotar_distribuicao_k(df_filtrado_usuario, k_col_analise, f"{copo_selecionado} ({bebida_selecionada})")

                # Intervalo de Confiança para k_medio
                data_k_ic = df_filtrado_usuario[k_col_analise].dropna()
                if len(data_k_ic) >= 2:
                    mean_k = np.mean(data_k_ic)
                    sem_k = stats.sem(data_k_ic)
                    confidence_level = 0.95
                    ci_k = stats.t.interval(confidence_level, len(data_k_ic)-1, loc=mean_k, scale=sem_k)
                    st.write(f"**Média de {k_col_analise}:** {mean_k:.5f}")
                    st.write(f"**Intervalo de Confiança {confidence_level*100:.0f}% para {k_col_analise}:** ({ci_k[0]:.5f}, {ci_k[1]:.5f})")
                else:
                    st.write(f"Não há dados suficientes para calcular o IC de {k_col_analise} (necessário pelo menos 2 pontos).")

                # Estatísticas descritivas para tempo_para_prox_Tamb
                st.subheader(f"Análise do Tempo Estimado para Atingir Próximo da Temp. Ambiente para '{copo_selecionado}' ({bebida_selecionada})")
                data_tempo_pred = df_filtrado_usuario['tempo_para_prox_Tamb'].dropna()
                if not data_tempo_pred.empty:
                    st.write(f"**Tempo Médio Estimado:** {np.mean(data_tempo_pred):.1f} minutos")
                    st.write(f"**Mediana do Tempo Estimado:** {np.median(data_tempo_pred):.1f} minutos")
                    st.write(f"**Desvio Padrão do Tempo:** {np.std(data_tempo_pred):.1f} minutos")
                    sns.histplot(data_tempo_pred, kde=True)
                    plt.title("Distribuição do Tempo Estimado para Atingir Próximo da Temp. Ambiente")
                    plt.xlabel("Tempo (minutos)")
                    st.pyplot(plt.gcf())
                    plt.clf()
                else:
                    st.write("Nenhuma predição de tempo válida disponível para este filtro.")

            else:
                st.write("Selecione filtros para ver as análises.")

        with tab2:
            st.subheader("Comparativo entre Copos (Teste t para Coeficiente $k$)")
            col_teste1, col_teste2 = st.columns(2)
            copo_comp1 = col_teste1.selectbox("Selecione o Copo 1 para Comparação:", copos_disponiveis, index=0)
            copo_comp2 = col_teste2.selectbox("Selecione o Copo 2 para Comparação:", copos_disponiveis, index=1 if len(copos_disponiveis)>1 else 0)
            bebida_comp = st.selectbox("Tipo de Bebida para Comparação:", bebidas_disponiveis)

            k_col_comparacao = 'k_estimado_regressao'
            if df_processado[df_processado['Copo'] == copo_comp1][k_col_comparacao].isnull().all() or \
               df_processado[df_processado['Copo'] == copo_comp2][k_col_comparacao].isnull().all():
                k_col_comparacao = 'k_medio_teste_pontual'
            st.write(f"Comparando usando a coluna: **{k_col_comparacao}**")

            data_copo1 = df_processado[(df_processado['Copo'] == copo_comp1) & (df_processado['Bebida'] == bebida_comp)][k_col_comparacao].dropna()
            data_copo2 = df_processado[(df_processado['Copo'] == copo_comp2) & (df_processado['Bebida'] == bebida_comp)][k_col_comparacao].dropna()

            if copo_comp1 == copo_comp2:
                st.warning("Selecione dois copos diferentes para comparação.")
            elif len(data_copo1) < 2 or len(data_copo2) < 2:
                st.warning(f"Não há dados suficientes para um ou ambos os copos ({copo_comp1}, {copo_comp2} para bebida {bebida_comp}) para realizar o teste t (necessário pelo menos 2 pontos de dados cada).")
            else:
                # Welch's t-test (não assume variâncias iguais)
                t_stat, p_value = stats.ttest_ind(data_copo1, data_copo2, equal_var=False)
                st.write(f"**Teste t entre {copo_comp1} e {copo_comp2} (Bebida: {bebida_comp}) para '{k_col_comparacao}':**")
                st.write(f"- Estatística t: {t_stat:.4f}")
                st.write(f"- Valor-p: {p_value:.4f}")
                alpha = 0.05
                if p_value < alpha:
                    st.success(f"Com um nível de significância de {alpha*100}%, rejeitamos a hipótese nula. Há uma diferença estatisticamente significativa entre as médias de '{k_col_comparacao}' dos copos.")
                else:
                    st.info(f"Com um nível de significância de {alpha*100}%, não rejeitamos a hipótese nula. Não há evidência suficiente para uma diferença estatisticamente significativa entre as médias de '{k_col_comparacao}' dos copos.")

        with tab3:
            st.subheader("Análise de Correlação")
            st.write("Matriz de correlação entre as principais variáveis numéricas do conjunto de dados completo:")
            cols_para_corr = ['T0'] + colunas_temperatura + ['k_medio_teste_pontual', 'k_estimado_regressao', 'tempo_para_prox_Tamb']
            df_para_corr = df_processado[cols_para_corr].copy() # Usar todos os dados para uma visão geral
            plotar_heatmap_correlacao(df_para_corr.dropna())

        with tab4:
            st.subheader(f"Detalhes da Regressão para '{copo_selecionado}' ({bebida_selecionada})")
            if not df_filtrado_usuario.empty:
                st.write("Valores de $k$ estimados por regressão não linear para cada teste e tempo previsto para atingir próximo da temperatura ambiente:")
                st.dataframe(df_filtrado_usuario[['Teste', 'T0', 'k_estimado_regressao', 'tempo_para_prox_Tamb']].style.format(precision=4))

                st.write(f"**Média de $k$ (Regressão):** {df_filtrado_usuario['k_estimado_regressao'].mean():.5f}")
                st.write(f"**Média do Tempo para Temp. Ambiente:** {df_filtrado_usuario['tempo_para_prox_Tamb'].mean():.1f} min")
            else:
                 st.write("Selecione filtros para ver os detalhes da regressão.")
else:
    st.info("Aguardando o carregamento de um arquivo CSV para iniciar a análise.")

st.sidebar.markdown("---")
st.sidebar.markdown("Dashboard ThermoTrack - Análises Avançadas.")
