import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.optimize import curve_fit
import requests

# --- Configurações Iniciais do Streamlit ---
st.set_page_config(layout="wide", page_title="ThermoTrack Dashboard")

# --- Funções de API ---
def buscar_dados_api(endpoint):
    """Função genérica para buscar dados de um endpoint da API."""
    API_URL = f"http://13.68.97.186:4000{endpoint}"
    try:
        response = requests.get(API_URL, timeout=10)
        response.raise_for_status()
        return pd.DataFrame(response.json())
    except requests.exceptions.RequestException as e:
        st.error(f"❌ Erro de Conexão ao buscar {endpoint}: {e}")
        return pd.DataFrame()
    except ValueError: # Erro de decodificação do JSON
        st.error(f"❌ Erro ao decodificar JSON do endpoint {endpoint}. Resposta não era um JSON válido.")
        return pd.DataFrame()

# --- Funções de Cálculo e Plotagem ---
# (As funções de cálculo e plotagem que já tínhamos permanecem aqui, com pequenos ajustes nos nomes das colunas)
def calcular_k_coeficientes(df, t_amb):
    df_calculado = df.copy()
    temp_cols_all = [col for col in df_calculado.columns if col.startswith('t') and col[1:].isdigit()]
    for col in ['t0'] + temp_cols_all:
        df_calculado[col] = pd.to_numeric(df_calculado[col], errors='coerce')
    df_calculado.dropna(subset=['t0'], inplace=True)
    temp_cols_measure = [col for col in df_calculado.columns if col.startswith('t') and col[1:].isdigit() and col != 't0']
    time_points_measure = np.array([int(col[1:]) for col in temp_cols_measure])
    if not temp_cols_measure: return df_calculado.assign(k_estimado_regressao=np.nan)
    k_estimados_regressao = []
    for index, row in df_calculado.iterrows():
        T0_teste = row['t0']
        temperaturas_teste = row[['t0'] + temp_cols_measure].values.astype(float)
        t_data = np.concatenate(([0], time_points_measure))
        valid_indices = ~np.isnan(temperaturas_teste)
        t_data_fit, T_data_fit = t_data[valid_indices], temperaturas_teste[valid_indices]
        if len(t_data_fit) < 2: k_estimados_regressao.append(np.nan); continue
        try:
            popt, _ = curve_fit(lambda t, k: temp_model(t, k, T0_teste, t_amb), t_data_fit, T_data_fit, p0=[0.01], maxfev=5000)
            k_estimados_regressao.append(popt[0])
        except (RuntimeError, ValueError): k_estimados_regressao.append(np.nan)
    df_calculado['k_estimado_regressao'] = k_estimados_regressao
    return df_calculado

def temp_model(t, k, T0, Tamb): return Tamb + (T0 - Tamb) * np.exp(-k * t)
def plotar_curvas_temperatura_filtrado(df_plot, t_amb):
    plt.figure(figsize=(10, 6)); temp_cols = ['t0'] + [col for col in df_plot.columns if col.startswith('t') and col[1:].isdigit()]
    tempo = np.array([0] + [int(col[1:]) for col in temp_cols if col != 't0'])
    for i, row in df_plot.iterrows(): plt.plot(tempo, row[temp_cols].values, marker='o', linestyle='-', label=f"Teste ID: {row['id']}")
    plt.axhline(t_amb, color='gray', linestyle='--', label=f'Temp. Ambiente ({t_amb}°C)'); plt.title(f'Curvas de Temperatura para: {df_plot["nome"].iloc[0]}')
    plt.xlabel('Tempo (minutos)'); plt.ylabel('Temperatura (°C)'); plt.legend(); plt.grid(True)
    st.pyplot(plt.gcf()); plt.clf()
def plotar_distribuicao_k(df_plot, title):
    plt.figure(figsize=(8, 5)); sns.histplot(df_plot['k_estimado_regressao'].dropna(), kde=True); plt.title(title)
    plt.xlabel('k_estimado_regressao'); plt.ylabel('Frequência'); st.pyplot(plt.gcf()); plt.clf()

# --- Interface Principal do Streamlit ---
st.title("🌡️ ThermoTrack - Análise de Desempenho do Copo")
params = st.query_params
copo_nome_selecionado = params.get("copo")
bebida_selecionada = params.get("bebida")
t_ambiente = st.sidebar.number_input("Temperatura Ambiente (°C) para Análise:", value=25.0, format="%.1f")

if not copo_nome_selecionado or not bebida_selecionada:
    st.warning("👈 Bem-vindo ao Dashboard de Análise ThermoTrack!")
    st.info("Este dashboard é gerado dinamicamente. Por favor, acesse-o através da sua aplicação principal após selecionar um copo e um tipo de bebida para analisar.")
else:
    st.header(f"Análise para: {copo_nome_selecionado} | Bebida: {bebida_selecionada.capitalize()}")
    st.markdown("---")
    
    with st.spinner('Buscando dados da API...'):
        df_testes = buscar_dados_api('/testes')
        df_copos = buscar_dados_api('/copos') # Busca o mapeamento de ID para nome

    if df_testes.empty or df_copos.empty:
        st.error("Não foi possível carregar os dados de testes ou de copos. Verifique os serviços da API.")
    else:
        # AQUI ESTÁ A MÁGICA: JUNTAR AS DUAS TABELAS
        # Renomeia as colunas do df_copos para evitar conflito ('id' -> 'copo_id_map', 'nome' -> 'nome_copo')
        # Supondo que a resposta de /copos tenha colunas 'id' e 'nome'
        df_copos.rename(columns={'id': 'copo_id', 'nome': 'Copo'}, inplace=True)
        
        # Junta (merge) os dados dos testes com os nomes dos copos
        df_total = pd.merge(df_testes, df_copos[['copo_id', 'Copo']], on='copo_id', how='left')
        
        # FILTRAR OS DADOS com base nos nomes corretos
        df_filtrado_usuario = df_total[
            (df_total['Copo'].str.lower() == copo_nome_selecionado.lower()) &
            (df_total['tipo'].str.lower() == bebida_selecionada.lower())
        ]

        if df_filtrado_usuario.empty:
            st.error(f"Nenhum dado de teste encontrado para o copo '{copo_nome_selecionado}' com bebida '{bebida_selecionada}'.")
        else:
            with st.spinner('Processando dados e calculando análises...'):
                df_processado = calcular_k_coeficientes(df_filtrado_usuario.copy(), t_ambiente)
            
            st.subheader("Curvas de Temperatura dos Testes Filtrados")
            plotar_curvas_temperatura_filtrado(df_processado, t_ambiente)
            
            st.subheader(f"Análise de Distribuição e IC para '{copo_nome_selecionado}'")
            k_col_analise = 'k_estimado_regressao'
            plotar_distribuicao_k(df_processado, f"Distribuição de k para {copo_nome_selecionado}")
            data_k_ic = df_processado[k_col_analise].dropna()
            if len(data_k_ic) >= 2:
                mean_k = np.mean(data_k_ic)
                sem_k = stats.sem(data_k_ic)
                ci_k = stats.t.interval(0.95, len(data_k_ic)-1, loc=mean_k, scale=sem_k)
                st.metric(label=f"Média de {k_col_analise}", value=f"{mean_k:.5f}", delta=f"IC 95%: ({ci_k[0]:.5f}, {ci_k[1]:.5f})", delta_color="off")