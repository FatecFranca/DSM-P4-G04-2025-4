import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';

const AtualizarCopo = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { copo, usuarioId } = route.params;

    const [nome, setNome] = useState(copo.nome);
    const [marca, setMarca] = useState(copo.marca);
    const [capacidade, setCapacidade] = useState(String(copo.capacidade_ml));

    const salvarAlteracoes = async () => {
        try {
            await api.put(`/copos/${copo.id}`, {
                nome,
                marca,
                capacidade_ml: parseInt(capacidade),
                usuario_id: usuarioId,
            });

            Alert.alert("Sucesso", "Copo atualizado com sucesso.");
            navigation.navigate('coposCadastrados', { usuarioId }); // Atualiza a lista
        } catch (error) {
            console.error("Erro ao atualizar copo:", error);
            Alert.alert("Erro", "Não foi possível atualizar o copo.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Atualizar Copo</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome do copo"
                value={nome}
                onChangeText={setNome}
                placeholderTextColor="#ccc"
            />
            <TextInput
                style={styles.input}
                placeholder="Marca"
                value={marca}
                onChangeText={setMarca}
                placeholderTextColor="#ccc"
            />
            <TextInput
                style={styles.input}
                placeholder="Capacidade (ml)"
                keyboardType="numeric"
                value={capacidade}
                onChangeText={setCapacidade}
                placeholderTextColor="#ccc"
            />

            <TouchableOpacity style={styles.botao} onPress={salvarAlteracoes}>
                <Text style={styles.textoBotao}>Salvar Alterações</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#181818',
        padding: 20,
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#333',
        color: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
    },
    botao: {
        backgroundColor: '#f1c40f',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    textoBotao: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
});

export default AtualizarCopo;
