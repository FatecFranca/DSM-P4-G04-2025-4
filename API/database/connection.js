var mysql = require("mysql2");

var connection = mysql.createConnection({
    host:"localhost",
    user:"admthermo",
    password:"FatecFranca123#",
    database: "ThermoTrack"
});

module.exports = connection;