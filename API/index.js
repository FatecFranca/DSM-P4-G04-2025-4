const Express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connection = require("./database/connection");
const homeController = require("./home/homeController");
const usuariosController = require("./usuarios/usuariosController"); // Adicione se tiver

const app = Express();
const porta = 4000;

// Configuração de CORS robusta
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:8081',
      'http://13.68.97.186:3000',
      'http://13.68.97.186:4000'
    ];

    // Se não houver origem (requisições sem CORS) ou estiver na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware CORS
app.use(cors(corsOptions));

// Parse de JSON e URL-encoded
app.use(Express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Arquivos estáticos
app.use(Express.static("public"));

// Configuração da view engine (se estiver usando)
app.set("view engine", "ejs");

// Conexão com banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar com o banco de dados:', err);
    process.exit(1);
  }
  console.log('Conexão com banco de dados estabelecida');
});

// Rotas
app.use("/", homeController);
app.use("/usuarios", usuariosController); // Adicione rotas de usuários

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    status: 'error',
    message: 'Erro interno do servidor'
  });
});

// Tratamento para rotas não encontradas
app.use((req, res, next) => {
  res.status(404).send({
    status: 'error',
    message: 'Rota não encontrada'
  });
});

// Iniciar servidor
app.listen(porta, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta: ${porta}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeição não tratada em:', promise, 'razão:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Exceção não capturada:', error);
});

module.exports = app;
