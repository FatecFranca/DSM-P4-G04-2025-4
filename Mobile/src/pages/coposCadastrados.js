import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import Icon from 'react-native-vector-icons/Feather';

const CoposCadastrados = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const { usuarioId, retornandoParaTeste = false, qtdNecessaria = 1, coposSelecionados: coposIniciais = [] } = route.params;

    const [copos, setCopos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selecionados, setSelecionados] = useState([...coposIniciais]);

    const fetchCopos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/copos');
            const coposUsuario = response.data.filter(copo => copo.usuario_id === usuarioId);
            setCopos(coposUsuario);
        } catch (error) {
            console.error("Erro ao buscar copos:", error);
            Alert.alert("Erro", "Não foi possível carregar os copos.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        fetchCopos();
    }, [usuarioId]));

    const alternarSelecao = (copo) => {
        const jaSelecionado = selecionados.find(c => c.id === copo.id);

        if (jaSelecionado) {
            setSelecionados(selecionados.filter(c => c.id !== copo.id));
        } else {
            if (selecionados.length >= qtdNecessaria) {
                Alert.alert("Limite atingido", `Você só pode selecionar até ${qtdNecessaria} copo(s).`);
                return;
            }
            setSelecionados([...selecionados, copo]);
        }
    };

    const confirmarSelecao = () => {
        if (selecionados.length < qtdNecessaria) {
            Alert.alert("Seleção incompleta", `Você precisa selecionar ${qtdNecessaria} copo(s).`);
            return;
        }

        navigation.navigate("TesteDeCopos", {
            usuarioId,
            coposSelecionados: selecionados,
            qtdNecessaria,
            retornandoParaTeste: true,
        });
    };

    const excluirCopo = async (id) => {
        try {
            await api.delete(`/copos/${id}`);
            setCopos(copos.filter(copo => copo.id !== id));
            Alert.alert("Sucesso", "Copo excluído com sucesso.");
        } catch (error) {
            console.error("Erro ao excluir copo:", error);
            Alert.alert("Erro", "Não foi possível excluir o copo.");
        }
    };

    const renderItem = ({ item }) => {
        const estaSelecionado = selecionados.some(c => c.id === item.id);

        return (
            <TouchableOpacity
                onPress={() => retornandoParaTeste && alternarSelecao(item)}
                style={[
                    styles.card,
                    retornandoParaTeste && estaSelecionado && styles.copoSelecionado
                ]}
                activeOpacity={retornandoParaTeste ? 0.7 : 1}
            >
                <View style={styles.headerCard}>
                    <Text style={styles.nome}>{item.nome}</Text>
                    <View style={styles.icones}>
                        <TouchableOpacity style={{ marginRight: 10 }} onPress={() => navigation.navigate("Dashboard", { usuarioId, copoId: item.id })}>
                            <Icon name="bar-chart-2" size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginRight: 10 }} onPress={() => navigation.navigate("TesteDeCopos", { copoId: item.id, usuarioId })}>
                            <Icon name="play" size={22} color="#edb11c" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginRight: 10 }} onPress={() => navigation.navigate("Ranking", { copoId: item.id, usuarioId })}>
                            <Icon name="award" size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginRight: 10 }} onPress={() => navigation.navigate("EditarCopo", { copo: item, usuarioId })}>
                            <Icon name="edit" size={22} color="#edb11c" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => excluirCopo(item.id)}>
                            <Icon name="trash-2" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.info}>Marca: {item.marca}</Text>
                <Text style={styles.info}>Capacidade: {item.capacidade_ml} ml</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Copos Cadastrados_</Text>

            <View style={styles.scrollContainer}>
                {loading ? (
                    <Text style={styles.loading}>Carregando...</Text>
                ) : copos.length > 0 ? (
                    <FlatList
                        data={copos}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.lista}
                        showsVerticalScrollIndicator={true}
                    />
                ) : (
                    <Text style={styles.nenhum}>Nenhum copo cadastrado ainda.</Text>
                )}
            </View>

            {retornandoParaTeste ? (
                <TouchableOpacity style={styles.botaoVoltar} onPress={confirmarSelecao}>
                    <Text style={styles.textoBotao}>Confirmar seleção</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
                    <Text style={styles.textoBotao}>Cadastrar novo copo</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#181818',
        padding: 20
    },
    scrollContainer: {
        flex: 1,
        marginBottom: 100
    },
    titulo: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#fff'
    },
    loading: {
        textAlign: 'center',
        marginTop: 20,
        color: '#aaa',
        fontSize: 16
    },
    nenhum: {
        textAlign: 'center',
        marginTop: 20,
        color: '#aaa',
        fontSize: 16
    },
    lista: { paddingBottom: 20 },
    card: {
        backgroundColor: '#333',
        padding: 18,
        borderRadius: 12,
        marginBottom: 15
    },
    copoSelecionado: {
        borderColor: '#edb11c',
        borderWidth: 2,
    },
    headerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    nome: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff'
    },
    info: {
        fontSize: 16,
        color: '#ccc'
    },
    botaoVoltar: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    textoBotao: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16
    },
    icones: {
        flexDirection: 'row',
        alignItems: 'center'
    },
});

export default CoposCadastrados;
