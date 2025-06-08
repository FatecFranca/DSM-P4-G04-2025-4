import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../services/api";

const Login = () => {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!nome || !senha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    setLoading(true);

    try {
      const response = await api.get("/usuarios");
      const usuarios = response.data;

      const usuarioEncontrado = usuarios.find(
        (user) =>
          user.nome.trim().toLowerCase() === nome.trim().toLowerCase() &&
          user.senha === senha
      );

      if (usuarioEncontrado) {
        Alert.alert("Sucesso", "Login realizado com sucesso!");
        navigation.navigate("CadCopo", { usuarioId: usuarioEncontrado.id });
      } else {
        Alert.alert("Erro", "Nome ou senha inválidos!");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      Alert.alert("Erro", "Não foi possível conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = () => {
    navigation.navigate("CadastrarUsuario");
  };

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={require("../images/icone_user.png")} />

      <TextInput
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor="#aaa"
        value={nome}
        onChangeText={setNome}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Entrando..." : "Entrar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonYellow, loading && styles.buttonDisabled]}
        onPress={handleCadastro}
        disabled={loading}
      >
        <Text style={styles.buttonTextBlack}>Cadastrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: 200,
    height:150,
    marginBottom: 30,
    resizeMode: "contain",
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    maxWidth: 300,
  },
  button: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
    marginBottom: 10,
  },
  buttonYellow: {
    backgroundColor: "#edb11c",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonTextBlack: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Login;
