import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  PanGestureHandler,
  Animated
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import Icon from 'react-native-vector-icons/Feather';

const { width: screenWidth } = Dimensions.get('window');

const Dashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { usuarioId, copoId } = route.params;
  
  const [testesData, setTestesData] = useState([]);
  const [copoInfo, setCopoInfo] = useState(null);
  const [dadosGraficos, setDadosGraficos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [graficoAtual, setGraficoAtual] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'frias', 'quentes'
  const carouselRef = useRef(null);
  const temperaturaAmbiente = 25;

  useEffect(() => {
    carregarDados();
  }, [usuarioId, copoId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const testesResponse = await api.get('/testes');
      const coposResponse = await api.get('/copos');
      const copo = coposResponse.data.find(c => c.id === copoId);
      
      if (!copo) {
        console.error('Copo não encontrado');
        return;
      }
      
      const testesFiltrados = testesResponse.data.filter(
        teste => teste.usuario_id === usuarioId && teste.copo_id === copoId
      );
      
      setCopoInfo(copo);
      setTestesData(testesFiltrados);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testesData.length > 0) {
      prepararTodosGraficos(testesData);
    }
  }, [testesData, filtroTipo]);

  const calcularCoeficienteK = (teste) => {
    const T0 = parseFloat(teste.t0);
    const tAmb = temperaturaAmbiente;
    const tempos = [10,20,30,40,50,60,70,80,90,100,110,120];
    const temperaturas = [
      teste.t10, teste.t20, teste.t30, teste.t40, teste.t50,
      teste.t60, teste.t70, teste.t80, teste.t90, teste.t100,
      teste.t110, teste.t120
    ].map(temp => parseFloat(temp));

    let somaK = 0;
    let contador = 0;

    for (let i = 0; i < tempos.length; i++) {
      const t = tempos[i];
      const Tt = temperaturas[i];
      const numerador = T0 - tAmb;
      const denominador = Tt - tAmb;

      if (numerador * denominador > 0 && denominador !== 0) {
        const k = (1 / t) * Math.log(numerador / denominador);
        somaK += k;
        contador++;
      }
    }

    return contador > 0 ? (somaK / contador) : null;
  };

  const calcularPerdaMedia = (teste) => {
    const t0 = parseFloat(teste.t0);
    const t120 = parseFloat(teste.t120);
    const perdaTotal = Math.abs(t0 - t120);
    return perdaTotal / 12; // Perda média a cada 10 minutos
  };

  const estimarTempoParaAmbiente = (teste) => {
    const T0 = parseFloat(teste.t0);
    const k = calcularCoeficienteK(teste);
    const tAmb = temperaturaAmbiente;
    const tolerancia = 0.5;
    const Tfinal = T0 > tAmb ? tAmb + tolerancia : tAmb - tolerancia;
    
    if (!k || k <= 0) return null;

    const argLog = (Tfinal - tAmb) / (T0 - tAmb);
    if (argLog > 0 && argLog < 1) {
      const tempo = (-1 / k) * Math.log(argLog);
      return tempo;
    }
    return null;
  };

  const prepararTodosGraficos = (testes) => {
    if (!testes || testes.length === 0) {
      setDadosGraficos([]);
      return;
    }

    // Filtrar testes baseado no tipo selecionado
    let testesFiltrados = testes;
    if (filtroTipo === 'frias') {
      testesFiltrados = testes.filter(teste => teste.tipo === 'fria');
    } else if (filtroTipo === 'quentes') {
      testesFiltrados = testes.filter(teste => teste.tipo === 'quente');
    }

    if (testesFiltrados.length === 0) {
      setDadosGraficos([]);
      return;
    }

    const cores = ['#00A651', '#007BC4', '#D62828', '#FF7F50', '#8A2BE2', '#FF1493'];
    const labels = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120'];
    
    // Gráfico 1: Curvas de Temperatura
    const graficoTemperatura = {
      id: 'temperatura',
      titulo: 'Curvas de Temperatura',
      subtitulo: 'Evolução da temperatura ao longo do tempo',
      tipo: 'line',
      data: {
        labels,
        datasets: testesFiltrados.map((teste, index) => ({
          data: [
            parseFloat(teste.t0),
            parseFloat(teste.t10),
            parseFloat(teste.t20),
            parseFloat(teste.t30),
            parseFloat(teste.t40),
            parseFloat(teste.t50),
            parseFloat(teste.t60),
            parseFloat(teste.t70),
            parseFloat(teste.t80),
            parseFloat(teste.t90),
            parseFloat(teste.t100),
            parseFloat(teste.t110),
            parseFloat(teste.t120)
          ],
          color: () => cores[index % cores.length],
          strokeWidth: 2,
        })),
        legend: testesFiltrados.map((teste, index) => `Teste ${index + 1} (${teste.tipo})`),
      }
    };

    // Gráfico 2: Distribuição dos Coeficientes K
    const coeficientesK = testesFiltrados.map(teste => calcularCoeficienteK(teste)).filter(k => k !== null);
    const graficoK = {
      id: 'coeficiente_k',
      titulo: 'Distribuição do Coeficiente K',
      subtitulo: 'Coeficiente de resfriamento por teste',
      tipo: 'bar',
      data: {
        labels: testesFiltrados.map((_, index) => `T${index + 1}`),
        datasets: [{
          data: coeficientesK.length > 0 ? coeficientesK.map(k => parseFloat(k.toFixed(4))) : [0],
          color: () => '#007BC4',
        }]
      }
    };

    // Novo Gráfico: K Médio por Teste
    const coeficientesKMedio = testesFiltrados.map(teste => calcularCoeficienteK(teste)).filter(k => k !== null);
    const graficoKMedio = {
      id: 'k_medio_teste',
      titulo: 'Coeficiente K Médio por Teste',
      subtitulo: 'Valor médio do coeficiente K para cada teste',
      tipo: 'bar',
      data: {
        labels: testesFiltrados.map((teste, index) => `T${index + 1}`).slice(0, coeficientesKMedio.length),
        datasets: [{
          data: coeficientesKMedio.length > 0 ? coeficientesKMedio.map(k => parseFloat(k.toFixed(5))) : [0],
          color: () => '#8A2BE2',
        }]
      }
    };

    // Gráfico 3: Perda de Temperatura Média
    const perdasMedias = testesFiltrados.map(teste => calcularPerdaMedia(teste));
    const graficoPerda = {
      id: 'perda_media',
      titulo: 'Perda Média de Temperatura',
      subtitulo: 'Perda média a cada 10 minutos (°C)',
      tipo: 'bar',
      data: {
        labels: testesFiltrados.map((_, index) => `T${index + 1}`),
        datasets: [{
          data: perdasMedias.map(p => parseFloat(p.toFixed(4))),
          color: () => '#D62828',
        }]
      }
    };

    // Gráfico 4: Tempo para Temperatura Ambiente
    const temposAmbiente = testesFiltrados.map(teste => estimarTempoParaAmbiente(teste)).filter(t => t !== null);
    const graficoTempo = {
      id: 'tempo_ambiente',
      titulo: 'Tempo para Temp. Ambiente',
      subtitulo: 'Tempo estimado para atingir temperatura ambiente (min)',
      tipo: 'bar',
      data: {
        labels: testesFiltrados.map((_, index) => `T${index + 1}`).slice(0, temposAmbiente.length),
        datasets: [{
          data: temposAmbiente.length > 0 ? temposAmbiente.map(t => parseFloat(t.toFixed(4))) : [0],
          color: () => '#00A651',
        }]
      }
    };

    // Gráfico 5: Comparativo Temperatura Inicial vs Final
    const graficoComparativo = {
      id: 'comparativo',
      titulo: 'Temperatura Inicial vs Final',
      subtitulo: 'Comparação entre T0 e T120',
      tipo: 'bar',
      data: {
        labels: testesFiltrados.map((_, index) => `T${index + 1}`),
        datasets: [
          {
            data: testesFiltrados.map(teste => parseFloat(parseFloat(teste.t0).toFixed(4))),
            color: () => '#FF7F50',
          },
          {
            data: testesFiltrados.map(teste => parseFloat(parseFloat(teste.t120).toFixed(4))),
            color: () => '#007BC4',
          }
        ],
        legend: ['Inicial (T0)', 'Final (T120)']
      }
    };

    // Montar array de gráficos
    const graficos = [
      graficoTemperatura,
      graficoK,
      graficoKMedio,
      graficoPerda,
      graficoTempo,
      graficoComparativo
    ];

    setDadosGraficos(graficos);
  };

  const renderGrafico = ({ item, index }) => {
    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 4, // 4 casas decimais para todos os gráficos
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      propsForDots: {
        r: '3',
        strokeWidth: '2',
        stroke: '#333',
      },
    };

    return (
      <View style={styles.graficoSlide}>
        <View style={styles.graficoHeader}>
          <Text style={styles.graficoTitulo}>{item.titulo}</Text>
          <Text style={styles.graficoSubtitulo}>{item.subtitulo}</Text>
        </View>
        
        <View style={styles.graficoContainer}>
          {item.tipo === 'line' ? (
            <LineChart
              data={{
                ...item.data,
                legend: undefined // Remove a legenda de cima
              }}
              width={screenWidth - 64}
              height={280}
              chartConfig={chartConfig}
              bezier
              style={styles.grafico}
            />
          ) : (
            <BarChart
              data={item.data}
              width={screenWidth - 64}
              height={280}
              chartConfig={chartConfig}
              style={styles.grafico}
              showValuesOnTopOfBars
            />
          )}
        </View>

        {item.data.legend && (
          <View style={styles.legendaContainer}>
            {item.data.legend.map((legenda, idx) => (
              <View key={idx} style={styles.legendaItem}>
                <View 
                  style={[
                    styles.legendaCor, 
                    { backgroundColor: item.data.datasets[idx]?.color() || '#333' }
                  ]} 
                />
                <Text style={styles.legendaTexto}>{legenda}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const handleFiltroChange = (novoFiltro) => {
    setFiltroTipo(novoFiltro);
    setGraficoAtual(0); // Reset para o primeiro gráfico
  };

  const renderBotoesFiltro = () => (
    <View style={styles.filtroContainer}>
      <TouchableOpacity
        style={[
          styles.botaoFiltro,
          filtroTipo === 'todos' && styles.botaoFiltroAtivo
        ]}
        onPress={() => handleFiltroChange('todos')}
      >
        <Text style={[
          styles.textoBotaoFiltro,
          filtroTipo === 'todos' && styles.textoBotaoFiltroAtivo
        ]}>
          Todos
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.botaoFiltro,
          filtroTipo === 'frias' && styles.botaoFiltroAtivo
        ]}
        onPress={() => handleFiltroChange('frias')}
      >
        <Text style={[
          styles.textoBotaoFiltro,
          filtroTipo === 'frias' && styles.textoBotaoFiltroAtivo
        ]}>
          Bebidas Frias
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.botaoFiltro,
          filtroTipo === 'quentes' && styles.botaoFiltroAtivo
        ]}
        onPress={() => handleFiltroChange('quentes')}
      >
        <Text style={[
          styles.textoBotaoFiltro,
          filtroTipo === 'quentes' && styles.textoBotaoFiltroAtivo
        ]}>
          Bebidas Quentes
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderIndicadores = () => (
    <View style={styles.indicadoresContainer}>
      {dadosGraficos.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.indicador,
            graficoAtual === index && styles.indicadorAtivo
          ]}
          onPress={() => {
            setGraficoAtual(index);
            carouselRef.current?.scrollToIndex({ index, animated: true });
          }}
        />
      ))}
    </View>
  );

  const renderInformacoes = () => {
    if (!copoInfo || testesData.length === 0) return null;

    return (
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitulo}>RELATÓRIO - {copoInfo.nome}</Text>
        <View style={styles.copoInfoHeader}>
          <Text style={styles.copoTitulo}>Marca: {copoInfo.marca}</Text>
          <Text style={styles.copoTitulo}>Capacidade: {copoInfo.capacidade_ml}ml</Text>
        </View>
        
        {testesData.map((teste, index) => {
          const dataInicio = new Date(teste.data_inicio).toLocaleDateString('pt-BR');
          const perdaMedia = calcularPerdaMedia(teste);
          const kMedio = calcularCoeficienteK(teste);
          const tempoAmb = estimarTempoParaAmbiente(teste);

          return (
            <View key={teste.id} style={styles.testeInfo}>
              <Text style={styles.testeTitulo}>Teste {index + 1} - {teste.tipo}</Text>
              <Text style={styles.testeDetalhe}>Data: {dataInicio}</Text>
              <Text style={styles.testeDetalhe}>Temperatura Inicial: {teste.t0}°C</Text>
              <Text style={styles.testeDetalhe}>Temperatura Final: {teste.t120}°C</Text>
              <Text style={styles.testeDetalhe}>Perda média a cada 10min: {perdaMedia.toFixed(2)}°C</Text>
              <Text style={styles.testeDetalhe}>Coef. médio k: {kMedio ? kMedio.toFixed(5) : 'N/A'}</Text>
              {tempoAmb && (
                <Text style={styles.testeDetalhe}>
                  Tempo estimado p/ temp. ambiente: {tempoAmb.toFixed(1)} min
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setGraficoAtual(viewableItems[0].index);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Dashboard de Análise</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {dadosGraficos.length > 0 ? (
          <>
            {renderBotoesFiltro()}
            <FlatList
              ref={carouselRef}
              data={dadosGraficos}
              renderItem={renderGrafico}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              decelerationRate="fast"
              snapToInterval={screenWidth}
              snapToAlignment="start"
              style={styles.carouselFlatList}
            />
            {renderIndicadores()}
          </>
        ) : (
          <View style={styles.mensagemContainer}>
            <Text style={styles.mensagem}>
              {filtroTipo === 'todos' 
                ? 'Nenhum teste encontrado para este copo'
                : `Nenhum teste de bebidas ${filtroTipo === 'frias' ? 'frias' : 'quentes'} encontrado`
              }
            </Text>
          </View>
        )}
        
        {renderInformacoes()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titulo: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: { 
    fontSize: 16, 
    color: '#666' 
  },
  carouselFlatList: {
    flexGrow: 0,
    marginVertical: 16,
  },
  graficoSlide: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    width: screenWidth - 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  graficoHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  graficoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  graficoSubtitulo: {
    fontSize: 14,
    color: '#666',
  },
  graficoContainer: {
    alignItems: 'center',
    padding: 16,
  },
  grafico: {
    borderRadius: 8,
  },
  legendaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 8,
    justifyContent: 'flex-start',
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendaCor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendaTexto: {
    fontSize: 12,
    color: '#666',
  },
  indicadoresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  indicador: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  indicadorAtivo: {
    backgroundColor: '#007BC4',
    width: 24,
  },
  mensagemContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
  },
  mensagem: { 
    fontSize: 16, 
    color: '#888', 
    textAlign: 'center' 
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  copoInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  copoTitulo: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#444' 
  },
  testeInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  testeTitulo: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#444', 
    marginBottom: 4 
  },
  testeDetalhe: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 2 
  },
  // Estilos dos botões de filtro
  filtroContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  botaoFiltro: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  botaoFiltroAtivo: {
    backgroundColor: '#007BC4',
    borderColor: '#007BC4',
  },
  textoBotaoFiltro: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  textoBotaoFiltroAtivo: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default Dashboard;