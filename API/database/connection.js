var mysql = require("mysql2");

var connection = mysql.createConnection({
    host: "13.68.97.186", 
    user: "admthermo",
    password: "FatecFranca123#",
    database: "ThermoTrack"
});

module.exports = connection;
