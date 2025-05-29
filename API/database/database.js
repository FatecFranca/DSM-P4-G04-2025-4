// criando uma variavel mysql importando o mysql2 (biblioteca)
var mysql = require("mysql2");

// realizando a conexão com o banco de dados
// criando uma variável connection com o método createConnection
// passando as informações de conexão
var connection = mysql.createConnection({
    host:"13.68.97.186:4000",
    user:"admthermo",
    password:"FatecFranca123#"
});

connection.connect(function(err) {
   
    if(err) throw err;
    
    console.log("Conectado!");

    connection.query("CREATE DATABASE if not exists MINHA_API", 
        function (err, result) {
        if (err) throw err;
        console.log("Banco de Dados OK !");
      });

});



