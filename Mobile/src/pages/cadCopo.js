import React, { Component } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, KeyboardAvoidingView, } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default class CadCopo extends Component {
  state = {

    marca: "",
    capacidade: "",
    estado:"",

  };
  handleCadastroCop = async () => {
    const { marca, capacidade, estado } = this.state;

    if (!marca || !capacidade || !estado) {
      alert("Preencha todos os campos para cadastrar o copo!");
      return;
    }

    const novoCopo = { marca, capacidade, estado };

    try {
      
      const coposSalvos = await AsyncStorage.getItem("copos");
      let listaCopos = coposSalvos ? JSON.parse(coposSalvos) : [];

      
      listaCopos.push(novoCopo);

     
      await AsyncStorage.setItem("copos", JSON.stringify(listaCopos));

      alert("Copo cadastrado com sucesso!");
      this.props.navigation.navigate("coposCadastrados");
    } catch (error) {
      alert("Erro ao salvar copo!");
      console.error(error);
    }
  };

  handleCoposCadastrados = () => {
        this.props.navigation.navigate("coposCadastrados");
    };

  render() {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>

          <View style={styles.texto1}>

            <Text style={styles.texto1_edit}>Agora vamos cadastrar os {'\n'}copos que serão testados _</Text>

          </View>

          <View style={styles.linha}>
            <Text style={styles.texto}>Marca:</Text>


            <Picker
              selectedValue={this.state.marca}
              style={{ flex: 1, color: "#fff", backgroundColor: "#717f72", borderRadius: 10 }}
              onValueChange={(itemValue) => this.setState({ marca: itemValue })}
            >
              <Picker.Item label="Selecione a marca" value="" />
              <Picker.Item label="Stanley" value="Stanley" />
              <Picker.Item label="Concorrente" value="Concorrente" />
              <Picker.Item label="Genérico" value="Generico" />
            </Picker>

          </View>

          
            
            <View style={styles.linha}>
              <Text style={styles.texto}>Capacidade:</Text>

              <Picker
                selectedValue={this.state.capacidade}
                style={{ flex: 1, color: "#fff", backgroundColor: "#717f72", borderRadius: 10 }}
                onValueChange={(itemValue) => this.setState({ capacidade: itemValue })}
              >
                <Picker.Item label="Selecione a capacidade" value="" />
                <Picker.Item label="473" value="473" />
              </Picker>
            </View>
            <View style={styles.linha}>
              <Text style={styles.texto}>Estado:</Text>

              <Picker
                selectedValue={this.state.estado}
                style={{ flex: 1, color: "#fff", backgroundColor: "#717f72", borderRadius: 10 }}
                onValueChange={(itemValue) => this.setState({ estado: itemValue })}
              >
                <Picker.Item label="Selecione o estado" value="" />
                <Picker.Item label="Frio" value="Frio" />
                <Picker.Item label="Quente" value="Quente" />
                
              </Picker>
            </View>

          
          
          <TouchableOpacity style={styles.button}
            onPress={this.handleCadastroCop}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}
            onPress={this.handleCoposCadastrados}>
            <Text style={styles.buttonText}>Copos cadastrados</Text>
          </TouchableOpacity>

        </View>
        <View style={styles.image}>
          <Image
            style={styles.image}
            source={require("../images/logo_thermoTrack.png")}
          />
        </View>
      </KeyboardAvoidingView>

    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "fff",
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#717f72",
    color: "#fff",
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

  texto1: {
    marginTop: 10,
    marginBottom: 30,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
    paddingHorizontal: 20,

  },
  texto1_edit: {
    fontSize: 25,
    fontWeight: "bold",
  },


  texto: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginRight: 10,

  },

  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "80%",
    marginBottom: 10,
  },

  image: {
    width: 300,
    height: 100,
    marginTop: 25,
    marginLeft: 30,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});




