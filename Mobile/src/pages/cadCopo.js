import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';

export default function CadCopo() {
  const navigation = useNavigation();
  const route = useRoute();
  const { usuarioId } = route.params;

  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [capacidade, setCapacidade] = useState('');

  const handleCadastro = async () => {
    if (!nome || !marca || !capacidade) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      await api.post('/copos', {
        nome,
        marca,
        capacidade_ml: parseInt(capacidade),
        usuario_id: usuarioId,
      });

      Alert.alert('Sucesso', 'Copo cadastrado com sucesso!');
      setNome('');
      setMarca('');
      setCapacidade('');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao cadastrar copo');
    }
  };

  return (
    <View style={styles.container}>
      

      <Image style={styles.image} source={require("../images/copo_gelo.png")} />

      <Text style={styles.titulo}>Cadastrar Copo_</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome do copo"
        placeholderTextColor="#aaa"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="Marca"
        placeholderTextColor="#aaa"
        value={marca}
        onChangeText={setMarca}
      />

      <TextInput
        style={styles.input}
        placeholder="Capacidade (ml)"
        placeholderTextColor="#aaa"
        value={capacidade}
        onChangeText={setCapacidade}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.botao} onPress={handleCadastro}>
        <Text style={styles.textoBotao}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.botao, { backgroundColor: '#edb11c', marginTop: 10 }]}
        onPress={() =>
          navigation.navigate('coposCadastrados', { usuarioId })
        }
      >
        <Text style={styles.textoBotaoPreto}>Copos cadastrados</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
    padding: 20,
    justifyContent: 'flex-start', // alterado de 'center' para 'flex-start'
  },
  titulo: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10, // opcional, para dar um respiro no topo
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  botao: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotao: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textoBotaoPreto: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
  width: 350,
  height: 250,
  marginTop: 10,
  marginBottom: -20, // valor negativo para "puxar" os elementos para cima
  alignSelf: 'center',
  resizeMode: 'contain',
},

});
