import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';


const Login = () => {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("")

  const navigation = useNavigation();

  const handleLogin = async () => {
    const user = await AsyncStorage.getItem("user")
    if (!user) {
      alert("Nenhum usuário cadastrado!")
      return
    }
    const userJson = JSON.parse(user)

    if (userJson.cpf === cpf && userJson.senha === senha) {
      navigation.navigate("CadCopo");
    } else {
      alert("CPF ou senha inválidos!")
    }
  };

  const handleCadastro = () => {
    navigation.navigate('CadastrarUsuario');
  };

  return (

    <View style={styles.container}>

      <View style={styles.box}>
        <Image
          style={styles.image}
          source={require("../images/icone_user.png")}
        />

        <TextInput
          style={styles.input}
          placeholder="CPF"
          placeholderTextColor="#fff"
          value={cpf}
          onChangeText={setCpf}
          keyboardType="numeric"
          autoCapitalize="none"

        ></TextInput>
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#fff"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}

        ></TextInput>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleCadastro}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>
    </View>

  );
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
    backgroundColor: "#717f72",
    opacity: 0.8,
    marginVertical: 10,
    width: "100%",
    maxWidth: 250,
  },

  button: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    maxWidth: 250,
    alignItems: "center",
    marginVertical: 5,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
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

  image: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: "contain",
  },


});

export default Login;