import React, { Component } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import api from '../services/api';

export default class CadUser extends Component {
  state = {
    nome: '',
    cpf: '',
    email: '',
    senha: '',
  };

  handleCadastro = async () => {
    const { nome, cpf, email, senha } = this.state;

    if (!nome || !cpf || !email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    const user = { nome, cpf, email, senha };

    try {
      await api.post('/usuarios', user);
      Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      this.props.navigation.navigate('Login');
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      Alert.alert("Erro", "Não foi possível cadastrar o usuário. Verifique sua conexão.");
    }
  };

  render() {
    const { nome, cpf, email, senha } = this.state;

    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Cadastro de Usuário_</Text>

        <Image style={styles.image} source={require('../images/icone_user.png')} />

        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor="#aaa"
          value={nome}
          onChangeText={(text) => this.setState({ nome: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="CPF"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={cpf}
          onChangeText={(text) => this.setState({ cpf: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => this.setState({ email: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={senha}
          onChangeText={(text) => this.setState({ senha: text })}
        />

        <TouchableOpacity style={styles.botao} onPress={this.handleCadastro}>
          <Text style={styles.textoBotao}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => this.props.navigation.navigate('Login')}>
          <Text style={styles.link}>Já possui uma conta? Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
    padding: 20,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 20,
    alignSelf: 'center',
    resizeMode: 'contain',
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
    marginTop: 10,
  },
  textoBotao: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    color: '#edb11c',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
