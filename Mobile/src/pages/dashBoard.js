import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Dashboard = () => {
  const [coposCadastrados, setCoposCadastrados] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState(null);
  const [loading, setLoading] = useState(true);

  const dadosAPI = [
    { marca: 'Stanley', capacidade: 473, estado: 'Frio', to: 0, perda_media_10min: 2, t10: 2, t20: 4, t30: 6, t40: 8, t50: 10, t60: 12, t70: 14, t80: 16, t90: 18, t100: 20, t110: 22, t120: 24 },
    { marca: 'Concorrente', capacidade: 473, estado: 'Frio', to: 0, perda_media_10min: 3, t10: 3, t20: 6, t30: 9, t40: 12, t50: 15, t60: 18, t70: 21, t80: 24, t90: 27, t100: 30, t110: 33, t120: 36 },
    { marca: 'Genérico', capacidade: 473, estado: 'Frio', to: 0, perda_media_10min: 6, t10: 6, t20: 12, t30: 18, t40: 24, t50: 30, t60: 36, t70: 42, t80: 48, t90: 54, t100: 60, t110: 66, t120: 72 },
    { marca: 'Stanley', capacidade: 473, estado: 'Quente', to: 18, perda_media_10min: 1, t10: 17, t20: 16, t30: 15, t40: 14, t50: 13, t60: 12, t70: 11, t80: 10, t90: 9, t100: 8, t110: 7, t120: 6 },
    { marca: 'Concorrente', capacidade: 473, estado: 'Quente', to: 18, perda_media_10min: 2, t10: 16, t20: 15, t30: 14, t40: 13, t50: 12, t60: 11, t70: 10, t80: 9, t90: 8, t100: 7, t110: 6, t120: 5 },
    { marca: 'Genérico', capacidade: 473, estado: 'Quente', to: 18, perda_media_10min: 3, t10: 15, t20: 14, t30: 13, t40: 10, t50: 9, t60: 8, t70: 7, t80: 6, t90: 5, t100: 4, t110: 3, t120: 2 }
  ];

  useEffect(() => {
    const carregarCoposCadastrados = async () => {
      try {
        const coposArmazenados = await AsyncStorage.getItem('copos');
        if (coposArmazenados) {
          const copos = JSON.parse(coposArmazenados);

         
          const coposCorrigidos = copos.map(copo => ({
            ...copo,
            marca:
              copo.marca.toLowerCase() === 'generico'
                ? 'Genérico'
                : copo.marca,
          }));

          setCoposCadastrados(coposCorrigidos);
        }
      } catch (error) {
        console.error('Erro ao carregar copos cadastrados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarCoposCadastrados();
  }, []);

  useEffect(() => {
    prepararDadosGrafico(coposCadastrados);
  }, [coposCadastrados]);

  const buscarDadosCopo = (marca, capacidade, estado) => {
    return dadosAPI.find(
      item =>
        item.marca === marca &&
        item.capacidade === Number(capacidade) &&
        item.estado === estado
    );
  };

  const prepararDadosGrafico = (copos) => {
    if (!copos || copos.length === 0) {
      setDadosGrafico(null);
      return;
    }
    
    const labels = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120'];
    const cores = ['#00A651', '#007BC4', '#D62828', '#FF7F50', '#8A2BE2', '#FF1493'];
    const datasetsMap = new Map();

    copos.forEach((copo) => {
      const chave = `${copo.marca}-${copo.capacidade}-${copo.estado}`;
      if (!datasetsMap.has(chave)) {
        const dadosCopo = buscarDadosCopo(copo.marca, copo.capacidade, copo.estado);
        if (dadosCopo) {
          datasetsMap.set(chave, {
            data: [
              dadosCopo.to,
              dadosCopo.t10,
              dadosCopo.t20,
              dadosCopo.t30,
              dadosCopo.t40,
              dadosCopo.t50,
              dadosCopo.t60,
              dadosCopo.t70,
              dadosCopo.t80,
              dadosCopo.t90,
              dadosCopo.t100,
              dadosCopo.t110,
              dadosCopo.t120
            ],
            label: `${copo.marca}`,
          });
        }
      }
    });

    const datasetsArray = Array.from(datasetsMap.values());
    const datasets = datasetsArray.map((item, index) => ({
      data: item.data,
      color: () => cores[index % cores.length],
      strokeWidth: 2,
    }));

    setDadosGrafico({
      labels,
      datasets,
      legend: datasetsArray.map(item => item.label),
    });
  };

  const renderGrafico = () => {
    if (!dadosGrafico || dadosGrafico.datasets.length === 0) {
      return (
        <View style={styles.mensagemContainer}>
          <Text style={styles.mensagem}>Nenhum copo cadastrado para exibir dados</Text>
        </View>
      );
    }

    return (
      <View style={styles.graficoContainer}>
        <LineChart
          data={dadosGrafico}
          width={Dimensions.get('window').width - 32}
          height={300}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: {
              r: '3',
              strokeWidth: '2',
              stroke: '#333',
            },
          }}
          bezier
          style={{ borderRadius: 8 }}
        />
      </View>
    );
  };

  const renderInformacoes = () => {
    if (coposCadastrados.length === 0) return null;

    return (
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitulo}>RELATÓRIO:</Text>
        {coposCadastrados.map((copo, index) => {
          const dadosCopo = buscarDadosCopo(copo.marca, copo.capacidade, copo.estado);
          if (!dadosCopo) return null;

          return (
            <View key={index} style={styles.copoInfo}>
              <Text style={styles.copoTitulo}>{copo.marca} ({copo.capacidade}ml)</Text>
              <Text style={styles.copoDetalhe}>Estado: {copo.estado}</Text>
              <Text style={styles.copoDetalhe}>Temperatura Inicial: {dadosCopo.to}°C</Text>
              <Text style={styles.copoDetalhe}>Perda média a cada 10min: {dadosCopo.perda_media_10min}°C</Text>
              <Text style={styles.copoDetalhe}>Temperatura após 2h: {dadosCopo.t120}°C</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Dashboard de Comparação</Text>
      {renderGrafico()}
      {renderInformacoes()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  graficoContainer: {
    height: 350,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mensagemContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  mensagem: {
    fontSize: 16,
    color: '#888',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  copoInfo: {
    marginBottom: 12,
  },
  copoTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#444',
  },
  copoDetalhe: {
    fontSize: 14,
    color: '#666',
  },
});

export default Dashboard;
