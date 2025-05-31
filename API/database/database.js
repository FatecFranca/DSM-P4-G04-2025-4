var mysql = require("mysql2");

var connection = mysql.createConnection({
    host: "13.68.97.186:4000",  // Removido :4000
    user: "admthermo",
    password: "FatecFranca123#"
});

connection.connect(function(err) {
    if(err) {
        console.error("Erro na conexão:", err);
        return;
    }
    console.log("Conectado!");
    
    connection.query("CREATE DATABASE IF NOT EXISTS ThermoTrack", 
        function (err, result) {
            if (err) {
                console.error("Erro ao criar banco de dados:", err);
                return;
            }
            console.log("Banco de Dados OK!");
        }
    );
});

module.exports = connection;
