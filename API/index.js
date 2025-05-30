const Express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connection = require("./database/connection");
const homeController = require("./home/homeController");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = Express();
const porta = process.env.PORT || 4000;

// Configuração de segurança
app.use(helmet());

// Limitador de requisições
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

// Configuração de CORS
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8081',
            'http://13.68.97.186:3000',
            'http://13.68.97.186',
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

// Middleware CORS
app.use(cors(corsOptions));

// Middleware para headers CORS adicionais
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Parse de JSON e URL-encoded
app.use(Express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Arquivos estáticos
app.use(Express.static("public"));

// Configuração da view engine
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
app.use("/api", homeController);

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
    console.error('Erro de middleware:', err);
    
    if (err.message === 'Origem não permitida pelo CORS') {
        return res.status(403).json({
            status: 'error',
            message: 'Acesso não autorizado'
        });
    }

    res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Tratamento para rotas não encontradas
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: 'Rota não encontrada'
    });
});

// Iniciar servidor
const server = app.listen(porta, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta: ${porta}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'razão:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Exceção não capturada:', error);
    process.exit(1);
});

module.exports = app;
