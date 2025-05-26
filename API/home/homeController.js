const express = require("express");
const router = express.Router();
const connection = require("../database/connection");
//const bcrypt = require("bcrypt");

router.get("/", (req, res) => {
    res.render("index");
});

//Rotas de usuários

// Rota para obter todos os usuários
router.get("/usuarios", (req, res) => {
    connection.query("SELECT * FROM Usuario", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Rota para cadastrar um usuário
router.post("/usuarios", (req, res) => {
    const { nome, senha, cpf, email } = req.body;

    // Verificações simples para garantir que os campos foram preenchidos
    if (!nome || !senha || !cpf || !email) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // Consulta SQL para inserir o usuário
    const query = "INSERT INTO Usuario (nome, senha, cpf, email) VALUES (?, ?, ?, ?)";
   
    // Passa a senha diretamente na consulta
    connection.query(query, [nome, senha, cpf, email], (err, results) => {
        if (err) {
            // Verifica se o erro é um conflito de CPF ou e-mail
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: "CPF ou e-mail já cadastrado." });
            }
            return res.status(500).json({ error: err });
        }

        res.status(201).json({ message: "Usuário cadastrado com sucesso!", userId: results.insertId });
    });
});

// Rota para consultar um usuário pelo CPF ou e-mail
router.get("/usuarios/login", (req, res) => {
    const { cpf, email } = req.query;

    // Verifica se pelo menos um dos parâmetros foi fornecido
    if (!cpf && !email) {
        return res.status(400).json({ message: "É necessário informar CPF ou e-mail." });
    }

    // Monta a consulta com base nos parâmetros fornecidos
    let query = "SELECT * FROM Usuario WHERE ";
    const params = [];

    if (cpf) {
        query += "cpf = ?";
        params.push(cpf);
    }
    if (email) {
        if (params.length > 0) {
            query += " OR ";
        }
        query += "email = ?";
        params.push(email);
    }

    // Executa a consulta
    connection.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        
        // Retorna o usuário encontrado (sem a senha)
        const user = results[0];
        delete user.senha; // Remove a senha antes de retornar
        res.json(user);
    });
});

// Rota para alterar a senha do usuário
router.put("/usuarios/senha", (req, res) => {
    const { cpf, email, novaSenha } = req.body;

    // Verificações simples para garantir que os campos foram preenchidos
    if (!novaSenha || (!cpf && !email)) {
        return res.status(400).json({ message: "É necessário informar CPF ou e-mail e a nova senha." });
    }

    // Monta a consulta de atualização
    const query = "UPDATE Usuario SET senha = ? WHERE cpf = ? OR email = ?";
    const params = [novaSenha, cpf, email];

    connection.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        res.json({ message: "Senha alterada com sucesso!" });
    });
});


//Rotas copos

// Rota para cadastrar um copo
router.post("/copos", (req, res) => {
    const { usuario_id, nome, marca, capacidade_ml} = req.body;

    // Verificações para garantir que os campos foram preenchidos
    if (!usuario_id || !nome || !marca || !capacidade_ml) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // Inserindo o copo no banco de dados
    const query = "INSERT INTO Copo (usuario_id, nome, marca, capacidade_ml) VALUES (?, ?, ?, ?)";
    connection.query(query, [usuario_id, nome, marca, capacidade_ml], (err, results) => {
        if (err) {
            // Verifica se o erro é um problema de chave estrangeira
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }
            return res.status(500).json({ error: err });
        }
        
        res.status(201).json({ message: "Copo cadastrado com sucesso!", copoId: results.insertId });
    });
});

// Rota para obter todos os copos
router.get("/copos", (req, res) => {
    connection.query("SELECT * FROM Copo", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Rota para alterar os dados de um copo
router.put("/copos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, marca, capacidade_ml} = req.body;

    // Verificações para garantir que pelo menos um campo foi fornecido
    if (!nome && !marca && !capacidade_ml) {
        return res.status(400).json({ message: "Pelo menos um campo deve ser fornecido para atualização." });
    }

    // Construindo a consulta SQL
    let query = "UPDATE Copo SET ";
    const updates = [];
    const values = [];

    if (nome) {
        updates.push("nome = ?");
        values.push(nome);
    }
    if (marca) {
        updates.push("marca = ?");
        values.push(marca);
    }
    if (capacidade_ml) {
        updates.push("capacidade_ml = ?");
        values.push(capacidade_ml);
    }

    // Adicionando o ID à consulta como condição
    query += updates.join(", ") + " WHERE id = ?";
    values.push(id);

    connection.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Copo não encontrado." });
        }
        
        res.json({ message: "Copo atualizado com sucesso!" });
    });
});

// Rota para consultar copos de um usuário específico
router.get("/copos/usuario/:usuario_id", (req, res) => {
    const { usuario_id } = req.params;

    const query = "SELECT * FROM Copo WHERE usuario_id = ?";
    connection.query(query, [usuario_id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Nenhum copo encontrado para este usuário." });
        }
        
        res.json(results);
    });
});

// Rota para listar os 10 primeiros copos ordenados pela coluna k_med, incluindo um copo específico
router.get("/copos/ranking/:copo_id", (req, res) => {
    const { copo_id } = req.params;

    // Consulta para obter os 10 copos com menor k_med
    const query = `
        (SELECT * FROM Copo WHERE id = ?)
        UNION ALL
        (SELECT * FROM Copo WHERE id != ? ORDER BY k_med LIMIT 10)
    `;

    const params = [copo_id, copo_id];

    connection.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });

        // Não duplicar o copo específico se ele estiver entre os 10 primeiros
        const copoEspecifico = results.find(copo => copo.id === parseInt(copo_id, 10));
        const coposRanking = results.filter(copo => copo.id !== parseInt(copo_id, 10));

        // Juntar o copo específico com copos classificados, se não estiver no ranking
        const response = copoEspecifico ? [copoEspecifico, ...coposRanking] : coposRanking;

        res.json(response);
    });
});


// Rota para excluir um copo
router.delete("/copos/:id", (req, res) => {
    const { id } = req.params;

    // Primeiro, vamos deletar os testes associados ao copo
    const deleteTestesQuery = "DELETE FROM Teste WHERE copo_id = ?";
    connection.query(deleteTestesQuery, [id], (err) => {
        if (err) return res.status(500).json({ error: err });

        // Agora, deletar o copo
        const deleteCopoQuery = "DELETE FROM Copo WHERE id = ?";
        connection.query(deleteCopoQuery, [id], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "Copo não encontrado." });
            }
            
            res.json({ message: "Copo excluído com sucesso!" });
        });
    });
});

//Rotas testes

// Rota para obter todos os testes
router.get("/testes", (req, res) => {
    connection.query("SELECT * FROM Teste", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Rota para obter um teste específico
router.get("/teste/:id", (req, res) => {
    const { id } = req.params;
    connection.query("SELECT * FROM Teste WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ message: "Teste não encontrado!" });
        res.json(results[0]);
    });
});

// Rota para obter todos os testes de um copo específico
router.get("/testes/copo/:copo_id", (req, res) => {
    const { copo_id } = req.params;

    // Monta a consulta para obter testes do copo específico
    const query = "SELECT * FROM Teste WHERE copo_id = ?";
    const params = [copo_id];

    connection.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Nenhum teste encontrado para este copo." });
        }

        res.json(results);
    });
});




module.exports = router;