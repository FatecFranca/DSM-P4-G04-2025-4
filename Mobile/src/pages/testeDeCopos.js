import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';

const TesteDeCopos = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { usuarioId, copoId, retornandoParaTeste, coposSelecionados: coposParam, qtdNecessaria } = route.params || {};

    const [tipoBebida, setTipoBebida] = useState(null);
    const [quantidade, setQuantidade] = useState(qtdNecessaria || 1);
    const [coposSelecionados, setCoposSelecionados] = useState([]);

    const selecionarTipo = (tipo) => setTipoBebida(tipo);

    const selecionarQuantidade = (qtd) => {
        setQuantidade(qtd);
        if (qtd > 1) {
            navigation.navigate("coposCadastrados", {
                usuarioId,
                retornandoParaTeste: true,
                coposSelecionados,
                qtdNecessaria: qtd
            });
        }
    };

    const carregarCopos = async () => {
        try {
            const response = await api.get('/copos');
            const copo = response.data.find(c => c.id === copoId);
            if (copo) setCoposSelecionados([copo]);
        } catch (error) {
            console.error("Erro ao buscar copo:", error);
        }
    };

    useEffect(() => {
        if (copoId) {
            carregarCopos();
        }
    }, [copoId]);

    useEffect(() => {
        if (retornandoParaTeste && coposParam) {
            setCoposSelecionados(coposParam);
        }
    }, [retornandoParaTeste, coposParam]);

    const tentarConectarSensor = () => {
        if (coposSelecionados.length !== quantidade) {
            Alert.alert("Seleção incompleta", `Você precisa selecionar ${quantidade} copo(s).`);
            return;
        }
        Alert.alert("Erro", "Não foi possível estabelecer uma conexão com o sensor de temperatura");
    };

    const navegarParaCadCopo = () => {
        navigation.navigate('CadCopo', { usuarioId });
    };

    const renderCopo = (copo, index) => (
        <View key={index} style={styles.card}>
            <Text style={styles.nome}>{copo.nome}</Text>
            <Text style={styles.info}>Marca: {copo.marca}</Text>
            <Text style={styles.info}>Capacidade: {copo.capacidade_ml} ml</Text>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.container} style={{ flex: 1 }}>
            <Text style={styles.titulo}>Copos selecionados:</Text>
            
            {/* ScrollView independente para os copos selecionados */}
            <ScrollView style={styles.scrollCopos} nestedScrollEnabled={true}>
                {coposSelecionados.map(renderCopo)}
            </ScrollView>

            <Text style={styles.titulo}>Selecione o tipo de bebida</Text>
            <View style={styles.row}>
                <TouchableOpacity onPress={() => selecionarTipo('fria')} style={styles.botaoCopo}>
                    <View style={[styles.selecaoContainer, tipoBebida === 'fria' && styles.selecionado]}>
                        <Image
                            source={require('../images/copo_gelo_white.png')}
                            style={styles.imagem}
                        />
                    </View>
                    <Text style={styles.label}>FRIA</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => selecionarTipo('quente')} style={styles.botaoCopo}>
                    <View style={[styles.selecaoContainer, tipoBebida === 'quente' && styles.selecionado]}>
                        <Image
                            source={require('../images/copo_quente.png')}
                            style={styles.imagem}
                        />
                    </View>
                    <Text style={styles.label}>QUENTE</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.titulo}>Quantos copos iremos testar?</Text>
            <View style={styles.numeroRow}>
                {[1, 2, 3].map(num => (
                    <TouchableOpacity
                        key={num}
                        onPress={() => selecionarQuantidade(num)}
                        style={styles.numeroContainer}
                    >
                        <View style={[styles.selecaoContainer, quantidade === num && styles.selecionado]}>
                            <Image
                                source={
                                    num === 1
                                        ? require('../images/numero_1.png')
                                        : num === 2
                                            ? require('../images/numero_2.png')
                                            : require('../images/numero_3.png')
                                }
                                style={styles.imagemPequena}
                            />
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.botaoPlay} onPress={tentarConectarSensor}>
                <Text style={styles.textoBotaoPlay}>Inicie seu teste</Text>
                <Image
                    source={require('../images/play_2.png')}
                    style={styles.playImagem}
                />
            </TouchableOpacity>

            {/* Novo botão para navegar para CadCopo */}
            <TouchableOpacity style={styles.botaoCadCopo} onPress={navegarParaCadCopo}>
                <Text style={styles.textoBotaoCadCopo}>Cadastrar novo copo</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#181818',
        padding: 20,
        flexGrow: 1,
    },
    titulo: {
        fontSize: 20,
        color: '#fff',
        marginVertical: 10,
        textAlign: 'center',
    },
    scrollCopos: {
        maxHeight: 200, // Limita altura e permite rolagem interna
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    numeroRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 5,
    },
    numeroContainer: {
        marginHorizontal: 8,
        alignItems: 'center',
    },
    botaoCopo: {
        alignItems: 'center',
    },
    selecaoContainer: {
        padding: 4,
        borderRadius: 12,
    },
    imagem: {
        width: 110,
        height: 110,
        resizeMode: 'contain',
        opacity: 0.6,
    },
    imagemPequena: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        opacity: 0.6,
    },
    selecionado: {
        opacity: 1,
        borderColor: '#edb11c',
        borderWidth: 2,
        borderRadius: 12,
    },
    label: {
        marginTop: 6,
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    botaoPlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
    },
    textoBotaoPlay: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        marginRight: 8,
    },
    playImagem: {
        width: 65,
        height: 65,
        resizeMode: 'contain',
    },
    card: {
        backgroundColor: '#333',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    nome: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff'
    },
    info: {
        fontSize: 14,
        color: '#ccc'
    },
    
    botaoCadCopo: {
        backgroundColor: '#edb11c',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    textoBotaoCadCopo: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TesteDeCopos;