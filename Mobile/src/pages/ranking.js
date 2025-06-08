import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';

const Ranking = () => {
    const route = useRoute();
    const { copoId } = route.params;

    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const response = await api.get(`/copos/ranking/${copoId}`);
                const dadosOrdenados = response.data.sort((a, b) => {
                    const aVal = Number(a.k_med);
                    const bVal = Number(b.k_med);
                    // Trata casos onde k_med pode ser null/undefined ou NaN
                    if (isNaN(aVal)) return 1;
                    if (isNaN(bVal)) return -1;
                    return aVal - bVal;
                });

                setRanking(dadosOrdenados);
            } catch (error) {
                console.error("Erro ao carregar ranking:", error);
                Alert.alert("Erro", "Não foi possível carregar o ranking.");
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, [copoId]);

    const renderItem = ({ item, index }) => {
        const destaque = item.id === copoId;

        const kmedNumber = Number(item.k_med);
        const kmedTexto = !isNaN(kmedNumber)
            ? `Eficiência (k_med): ${kmedNumber.toFixed(4)}`
            : 'Kmed não cadastrado';

        return (
            <View style={[styles.item, destaque && styles.itemDestaque]}>
                <Text style={styles.posicao}>{index + 1}º</Text>
                <View style={styles.infoContainer}>
                    <Text style={[styles.nome, destaque && styles.nomeDestaque]}>{item.nome}</Text>
                    <Text style={styles.marca}>Marca: {item.marca || 'Não informada'}</Text>
                    <Text style={styles.kmed}>{kmedTexto}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Ranking de Eficiência</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#edb11c" />
            ) : (
                <FlatList
                    data={ranking}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                />
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
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#fff',
        textAlign: 'center'
    },
    item: {
        backgroundColor: '#2a2a2a',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    itemDestaque: {
        borderWidth: 2,
        borderColor: '#edb11c',
        backgroundColor: '#333'
    },
    posicao: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#edb11c',
        width: 40,
        textAlign: 'center'
    },
    infoContainer: {
        marginLeft: 10
    },
    nome: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff'
    },
    nomeDestaque: {
        color: '#edb11c'
    },
    marca: {
        fontSize: 14,
        color: '#aaa'
    },
    kmed: {
        fontSize: 14,
        color: '#ccc'
    }
});

export default Ranking;
