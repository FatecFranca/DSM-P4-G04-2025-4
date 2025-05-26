import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Image } from "react-native";
import Login from "./pages/login";
import CadUser from "./pages/cadUser";
import CadCopo from "./pages/cadCopo";
import CoposCadastrados from "./pages/coposCadastrados";
import Dashboard from "./pages/dashBoard";



const Stack = createStackNavigator();

export default function Routes() {


    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Login"
                component={Login}
                options={{
                    headerTitle: () => <Image source={require('./images/logo_thermoTrack.png')}
                        style={{ width: 300, height: 150, resizeMode: 'contain' }} />,
                    headerTitleAlign: "center",
                    headerStyle: { backgroundColor: "#edb11c" },
                    headerTitleStyle: { color: "black" },
                }} />
            <Stack.Screen
                name="CadastrarUsuario"
                component={CadUser}
                options={{
                    headerTitle: () => <Image source={require('./images/logo_thermoTrack.png')}
                        style={{ width: 300, height: 150, resizeMode: 'contain' }} />,
                    headerTitleAlign: "center",
                    headerStyle: {
                        backgroundColor: "#edb11c",
                    },
                    headerTitleStyle: {
                        color: "#fff",
                        fontWeight: "bold",
                    },


                }}
            />
            <Stack.Screen
                name="CadCopo"
                component={CadCopo}
                options={{
                    headerTitle: () => <Image source={require('./images/logo_thermoTrack.png')}
                        style={{ width: 300, height: 150, resizeMode: 'contain' }} />,
                    headerTitleAlign: "center",
                    headerStyle: { backgroundColor: "#edb11c" },
                    headerTitleStyle: { color: "black" },
                }} />
            <Stack.Screen
                name="coposCadastrados"
                component={CoposCadastrados}
                options={{
                    headerTitle: () => <Image source={require('./images/logo_thermoTrack.png')}
                        style={{ width: 300, height: 150, resizeMode: 'contain' }} />,
                    headerTitleAlign: "center",
                    headerStyle: { backgroundColor: "#edb11c" },
                    headerTitleStyle: { color: "black" },
                }} />
            <Stack.Screen
                name="Dashboard"
                component={Dashboard}
                options={{
                    headerTitle: () => (
                        <Image
                            source={require('./images/logo_thermoTrack.png')}
                            style={{ width: 300, height: 150, resizeMode: 'contain' }}
                        />
                    ),
                    headerTitleAlign: "center",
                    headerStyle: {
                        backgroundColor: "#edb11c"
                    },
                    headerTitleStyle: {
                        color: "black"
                    },
                }}
            />
        </Stack.Navigator>
    );
}