const Express = require('express');
const app = Express();
const cors = require('cors');
const connection = require("./database/connection");
const homeController = require("./home/homeController");
const bodyParser = require('body-parser');
const porta = 4000;


// Configuração de CORS
const corsOptions = {
  origin: function (origin, callback) {
      const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:8081',
          'http://13.68.97.186:3000',
          'http://13.68.97.186',
          'http://localhost:8080',
          /^http:\/\/localhost:\d+$/,
          '*'
      ];

      if (!origin || allowedOrigins.some(allowed => 
          (typeof allowed === 'string' && allowed === origin) || 
          (allowed instanceof RegExp && allowed.test(origin))
      )) {
          callback(null, true);
      } else {
          callback(new Error('Origem não permitida pelo CORS'));
      }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Origin',
      'X-Requested-With',
      'Accept'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// engine vai ser ejs
app.set("view engine", "ejs");

// pasta estatica de arquivos
app.use(Express.static("public")); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/", homeController);

app.listen(porta, () => {

    console.log("Servidor rodando na porta: " + porta);

});