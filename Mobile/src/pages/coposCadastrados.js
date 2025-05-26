import React, { Component } from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default class CoposCadastrados extends Component {
    state = {
        copos: [],
    };

    async componentDidMount() {
        try {
            const coposSalvos = await AsyncStorage.getItem("copos");
            const listaCopos = coposSalvos ? JSON.parse(coposSalvos) : [];
            this.setState({ copos: listaCopos });
        } catch (error) {
            console.error("Erro ao buscar copos:", error);
        }



    }

    removerCopo = (index) => {
        const novosCopos = [...this.state.copos];
        novosCopos.splice(index, 1);
        this.setState({ copos: novosCopos });
        AsyncStorage.setItem("copos", JSON.stringify(novosCopos));
    };

    irParaDashboard = () => {
        this.props.navigation.navigate("Dashboard", { copos: this.state.copos });
    };


    handleCadastroCop = () => {
        this.props.navigation.navigate("CadCopo");
    };

    renderItem = ({ item, index }) => (
        <View style={styles.item}>
            <View style={styles.itemContent}>
                <View style={styles.textContainer}>
                    <Text style={styles.texto}>{item.marca}</Text>
                    <Text style={styles.texto}>{item.capacidade} ml</Text>
                    <Text style={styles.texto}>{item.estado}</Text>
                </View>


                <TouchableOpacity
                    style={styles.button_item}
                    onPress={() => this.removerCopo(index)}
                >
                    <Text style={styles.buttonText}>X</Text>
                </TouchableOpacity>

            </View>
        </View>
    );





    render() {
        return (
            <View style={styles.container}>

                <View style={styles.imageContainer}>
                    <Image
                        style={styles.imgItem1}
                        resizeMode="cover"
                        source={require("../images/copo_gelo.png")}
                    />

                    <TouchableOpacity onPress={this.irParaDashboard}>
                        <Image
                            style={styles.imgItem2}
                            resizeMode="cover"
                            source={require("../images/play.png")}
                        />
                    </TouchableOpacity>
                </View>




                <TouchableOpacity style={styles.button}
                    onPress={this.handleCadastroCop}>
                    <Text style={styles.buttonText}>Cadastrar novo copo</Text>
                </TouchableOpacity>


                <View style={styles.listaContainer}>
                    <Text style={styles.titulo}>Copos Cadastrados:</Text>
                    <FlatList
                        contentContainerStyle={{ paddingBottom: 20 }}
                        data={this.state.copos}
                        renderItem={this.renderItem}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </View>

            </View >
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0,
        paddingHorizontal: 20,
        backgroundColor: "#f0f0f0",
    },
    titulo: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        padding: 20
    },
    item: {

        backgroundColor: "#ddd",
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
    },
    texto: {
        fontSize: 18,
    },
    imageContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        marginTop: -100
    },
    imgItem1: {
        width: "50%",
        height: 400,
        borderRadius: 10,
    },
    imgItem2: {
        width: 100,
        height: 500,
        marginRight: 10,
        marginRight: 50
    },

    button: {
        backgroundColor: "black",
        borderRadius: 10,
        padding: 10,
        width: "100%",
        alignItems: "center",
        padding: 20,
        marginTop: -150
    },

    itemContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    button_item: {
        backgroundColor: "#c9010e",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText_item: {
        color: "#fff",
        fontWeight: "bold",

    },
    listaContainer: {
    flex: 1,
},

});
