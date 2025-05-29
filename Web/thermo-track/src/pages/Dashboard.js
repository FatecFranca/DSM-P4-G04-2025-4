import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Line, Radar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  RadarController,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  mean,
  median,
  std,
  variance
} from 'mathjs';
import styled from 'styled-components';
import theme from '../styles/theme';

// Registro de componentes do Chart.js
ChartJS.register(
  RadarController,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
    const location = useLocation();
    const [copoDashboard, setCopoDashboard] = useState(null);
    const [dadosTemperatura, setDadosTemperatura] = useState({
        tempos: [],
        temperaturas: []
    });
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    // Função para buscar dados da API
    const buscarDadosTemperatura = async (copo) => {
        try {
            setLoading(true);
            // URL base da API
            const baseUrl = 'http://13.68.97.186:4000';
            
            // Primeiro, busca os dados de temperatura
            const response = await axios.get(`${baseUrl}/dados-temperatura/${copo.id}`);
            
            if (response.data && response.data.temperaturas) {
                const tempos = response.data.temperaturas.map((_, index) => `${index * 10}`);
                
                setDadosTemperatura({
                    tempos,
                    temperaturas: response.data.temperaturas
                });
            } else {
                throw new Error('Formato de dados inválido');
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            setErro('Não foi possível carregar os dados de temperatura');
            // Dados fictícios em caso de falha
            setDadosTemperatura({
                tempos: ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120'],
                temperaturas: [20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0, -2, -4]
            });
        } finally {
            setLoading(false);
        }
    };

    // Simulação de modelo de resfriamento
    const calcularModeloResfriamento = (temperaturas, tempoAmbiente = 25) => {
        const k_valores = temperaturas.slice(1).map((temp, index) => {
            const t = (index + 1) * 10;
            const T0 = temperaturas[0];
            const Tt = temp;
            return Math.log((T0 - tempoAmbiente) / (Tt - tempoAmbiente)) / t;
        });

        return {
            k_medio: mean(k_valores),
            k_desvio_padrao: std(k_valores),
            tempo_estimado_ambiente: calcularTempoParaAmbiente(
                mean(k_valores),
                temperaturas[0]
            )
        };
    };

    const calcularTempoParaAmbiente = (k, T0, tempoAmbiente = 25, tolerancia = 0.5) => {
        if (k <= 0) return null;
        const T_final = T0 > tempoAmbiente
            ? tempoAmbiente + tolerancia
            : tempoAmbiente - tolerancia;
        return -Math.log((T_final - tempoAmbiente) / (T0 - tempoAmbiente)) / k;
    };

    useEffect(() => {
        if (location.state && location.state.copoDashboard) {
            setCopoDashboard(location.state.copoDashboard);
            buscarDadosTemperatura(location.state.copoDashboard);
        }
    }, [location]);

    const calcularMetricas = () => {
        const temps = dadosTemperatura.temperaturas;
        const modeloResfriamento = calcularModeloResfriamento(temps);

        return {
            media: mean(temps),
            mediana: median(temps),
            desvioPadrao: std(temps),
            variancia: variance(temps),
            coeficienteResfriamento: modeloResfriamento.k_medio,
            tempoEstimadoAmbiente: modeloResfriamento.tempo_estimado_ambiente
        };
    };

    const renderizarGraficoTemperatura = () => ({
        labels: dadosTemperatura.tempos,
        datasets: [{
            label: 'Temperatura',
            data: dadosTemperatura.temperaturas,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary + '80'
        }]
    });

    const renderizarGraficoAnaliseEstatistica = (metricas) => ({
        labels: [
            'Média',
            'Mediana',
            'Desvio Padrão',
            'Variância',
            'Coef. Resfriamento'
        ],
        datasets: [{
            label: 'Métricas Estatísticas',
            data: [
                metricas.media,
                metricas.mediana,
                metricas.desvioPadrao,
                metricas.variancia,
                metricas.coeficienteResfriamento
            ],
            backgroundColor: theme.colors.secondary + '80'
        }]
    });

    // Renderização condicional
    if (!copoDashboard) return <Container>Nenhum copo selecionado</Container>;
    if (loading) return <Container>Carregando dados...</Container>;

    // Verificar se há dados de temperatura
    if (dadosTemperatura.temperaturas.length === 0) {
        return <Container>Sem dados de temperatura disponíveis</Container>;
    }

    const metricas = calcularMetricas();

    return (
        <Container>
            <Titulo>Dashboard Térmico - {copoDashboard.marca}</Titulo>
            
            <SecaoInformacoes>
                <InfoCopo>Marca: {copoDashboard.marca}</InfoCopo>
                <InfoCopo>Capacidade: {copoDashboard.capacidade} ml</InfoCopo>
                <InfoCopo>Estado: {copoDashboard.estado}</InfoCopo>
            </SecaoInformacoes>

            <SecaoGraficos>
                <GraficoContainer>
                    <TituloSecao>Curva de Temperatura</TituloSecao>
                    <Line
                        data={renderizarGraficoTemperatura()}
                        options={{
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Variação de Temperatura ao Longo do Tempo'
                                }
                            }
                        }}
                    />
                </GraficoContainer>

                <GraficoContainer>
                    <TituloSecao>Análise Estatística</TituloSecao>
                    <Radar
                        data={renderizarGraficoAnaliseEstatistica(metricas)}
                        options={{
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Métricas de Desempenho Térmico'
                                }
                            }
                        }}
                    />
                </GraficoContainer>
            </SecaoGraficos>

            <SecaoMetricas>
                <TituloSecao>Detalhes das Métricas Térmicas</TituloSecao>
                <MetricasGrid>
                    <ItemMetrica>
                        <strong>Temperatura Média:</strong> {metricas.media.toFixed(2)}°C
                    </ItemMetrica>
                    <ItemMetrica>
                        <strong>Temperatura Mediana:</strong> {metricas.mediana.toFixed(2)}°C
                    </ItemMetrica>
                    <ItemMetrica>
                        <strong>Desvio Padrão:</strong> {metricas.desvioPadrao.toFixed(2)}°C
                    </ItemMetrica>
                    <ItemMetrica>
                        <strong>Variância Térmica:</strong> {metricas.variancia.toFixed(2)}
                    </ItemMetrica>
                    <ItemMetrica>
                        <strong>Coeficiente Resfriamento:</strong> {metricas.coeficienteResfriamento.toFixed(4)}
                    </ItemMetrica>
                    <ItemMetrica>
                        <strong>Tempo p/ Temp. Ambiente:</strong>
                        {metricas.tempoEstimadoAmbiente
                            ? `${metricas.tempoEstimadoAmbiente.toFixed(1)} min`
                            : 'Não calculado'}
                    </ItemMetrica>
                </MetricasGrid>
            </SecaoMetricas>

            {erro && <ErroContainer>{erro}</ErroContainer>}
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    padding: 20px;
    background-color: ${theme.colors.secondary};
    min-height: 100vh;
`;

const Titulo = styled.h1`
    text-align: center;
    color: ${theme.colors.primary};
    margin-bottom: 30px;
`;

const SecaoInformacoes = styled.div`
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
`;

const InfoCopo = styled.div`
    background-color: ${theme.colors.primary};
    color: ${theme.colors.text.dark};
    padding: 10px;
    border-radius: 5px;
`;

const SecaoGraficos = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
`;

const GraficoContainer = styled.div`
    flex: 1;
    background-color: white;
    border-radius: 10px;
    padding: 20px;
`;

const SecaoMetricas = styled.div`
    background-color: white;
    border-radius: 10px;
    padding: 20px;
`;

const TituloSecao = styled.h2`
    text-align: center;
    margin-bottom: 20px;
    color: ${theme.colors.secondary};
`;

const MetricasGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
`;

const ItemMetrica = styled.div`
    background-color: ${theme.colors.primary};
    color: ${theme.colors.text.dark};
    padding: 10px;
    border-radius: 5px;
    text-align: center;
`;

const ErroContainer = styled.div`
    background-color: ${theme.colors.error};
    color: ${theme.colors.text.light};
    padding: 15px;
    text-align: center;
    border-radius: 5px;
    margin-top: 20px;
`;

export default Dashboard;
