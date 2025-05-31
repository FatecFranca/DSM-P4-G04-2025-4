var mysql = require("mysql2");

var connection = mysql.createConnection({
    host: "localhost",  // Removido :4000
    user: "admthermo",
    password: "FatecFranca123#",
    database: "ThermoTrack"
});

module.exports = connection;
