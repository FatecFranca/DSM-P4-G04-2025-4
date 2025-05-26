import React, { Component } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';

export default class CadUser extends Component {
  state = {
    cpf: "",
    senha: "",
  };
  handleCadastro = async () => {
    const { cpf, senha, } = this.state;
    if (!cpf || !senha) {
      alert("Preencha todos os campos!");
      return;
    }

    const user = { cpf, senha };

    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));
      alert("Usuário cadastrado com sucesso!");
      this.props.navigation.navigate("Login");
    } catch (error) {
      alert("Erro ao salvar usuário!");
      console.error(error);
    }
  };

  render() {
    return (
      <View style={styles.container}>

        <View style={styles.box}>

          <Text style={styles.texto}>CADASTRO DE USUÁRIO</Text>
          

        <TextInput
          style={styles.input}
          placeholder="CPF"
          placeholderTextColor={"#fff"}
          value={this.state.cpf}
          onChangeText={(cpf) => this.setState({ cpf })}
          autoCapitalize="none"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={"#fff"}
          secureTextEntry={true}
          value={this.state.senha}
          onChangeText={(senha) => this.setState({ senha })}
        />
        <TouchableOpacity style={styles.button} onPress={this.handleCadastro}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#717f72",
  },
  input: {
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    width: "80%",
    backgroundColor: "#717f72",
  },
  button: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 10,
    width: "80%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  box: {
    backgroundColor: "#edb11c",
    width: "80%",
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 20,
    elevation: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    alignItems: "center",
    minHeight: 400,
  },

  texto: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
});




