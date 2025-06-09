const express = require("express");
const router = express.Router();
const connection = require("../database/connection");
const axios = require('axios');

// Página inicial
router.get("/", (req, res) => {
    res.render("index");
});

/* ===================== ROTAS DE USUÁRIO ===================== */

// Obter todos os usuários
router.get("/usuarios", (req, res) => {
    connection.query("SELECT * FROM Usuario", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Cadastrar novo usuário
router.post("/usuarios", (req, res) => {
    const { nome, senha, cpf, email } = req.body;

    if (!nome || !senha || !cpf || !email) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    const query = "INSERT INTO Usuario (nome, senha, cpf, email) VALUES (?, ?, ?, ?)";
    connection.query(query, [nome, senha, cpf, email], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: "CPF ou e-mail já cadastrado." });
            }
            return res.status(500).json({ error: err });
        }
        res.status(201).json({ message: "Usuário cadastrado com sucesso!", userId: results.insertId });
    });
});

// Consultar usuário pelo CPF ou e-mail (login)
router.get("/usuarios/login", (req, res) => {
    const { cpf, email } = req.query;

    if (!cpf && !email) {
        return res.status(400).json({ message: "CPF ou e-mail é obrigatório" });
    }

    let query = "SELECT * FROM Usuario WHERE ";
    const params = [];
    
    if (cpf) {
        query += "cpf = ?";
        params.push(cpf);
    }
    
    if (email) {
        if (params.length > 0) query += " OR ";
        query += "email = ?";
        params.push(email);
    }

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro na consulta:', err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        const user = results[0];
        // IMPORTANTE: Retornar a senha para validação
        res.json(user);
    });
});

// Alterar senha do usuário
router.put("/usuarios/senha", (req, res) => {
    const { cpf, email, novaSenha } = req.body;

    if (!novaSenha || (!cpf && !email)) {
        return res.status(400).json({ message: "É necessário informar CPF ou e-mail e a nova senha." });
    }

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

/* ===================== ROTAS DE COPO ===================== */

// Cadastrar novo copo
router.post("/copos", (req, res) => {
    const { usuario_id, nome, marca, capacidade_ml } = req.body;
    if (!usuario_id || !nome || !marca || !capacidade_ml) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }
    const query = "INSERT INTO Copo (usuario_id, nome, marca, capacidade_ml) VALUES (?, ?, ?, ?)";
    connection.query(query, [usuario_id, nome, marca, capacidade_ml], (err, results) => {
        if (err) {
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }
            return res.status(500).json({ error: err });
        }
        res.status(201).json({ message: "Copo cadastrado com sucesso!", copoId: results.insertId });
    });
});

// Obter todos os copos
router.get("/copos", (req, res) => {
    connection.query("SELECT * FROM Copo", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Atualizar um copo (nome, marca, capacidade)
router.put("/copos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, marca, capacidade_ml } = req.body;
    if (!nome && !marca && !capacidade_ml) {
        return res.status(400).json({ message: "Pelo menos um campo deve ser fornecido para atualização." });
    }
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

// Consultar copos de um usuário específico
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

// Ranking dos 10 copos mais eficientes (menor k_med), incluindo copo específico
router.get("/copos/ranking/:copo_id", (req, res) => {
    const { copo_id } = req.params;
    const query = `
        (SELECT * FROM Copo WHERE id = ?)
        UNION ALL
        (SELECT * FROM Copo WHERE id != ? ORDER BY k_med LIMIT 10)
    `;
    const params = [copo_id, copo_id];

    connection.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });

        const copoEspecifico = results.find(copo => copo.id === parseInt(copo_id, 10));
        const coposRanking = results.filter(copo => copo.id !== parseInt(copo_id, 10));
        const response = copoEspecifico ? [copoEspecifico, ...coposRanking] : coposRanking;

        res.json(response);
    });
});

// Excluir um copo (e seus testes)
router.delete("/copos/:id", (req, res) => {
    const { id } = req.params;
    const deleteTestesQuery = "DELETE FROM Teste WHERE copo_id = ?";
    connection.query(deleteTestesQuery, [id], (err) => {
        if (err) return res.status(500).json({ error: err });
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

/* ===================== ROTAS DE TESTE ===================== */

// Obter todos os testes
router.get("/testes", (req, res) => {
    connection.query("SELECT * FROM Teste", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Obter teste específico
router.get("/teste/:id", (req, res) => {
    const { id } = req.params;
    connection.query("SELECT * FROM Teste WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ message: "Teste não encontrado!" });
        res.json(results[0]);
    });
});

// Obter todos os testes de um copo específico
router.get("/testes/copo/:copo_id", (req, res) => {
    const { copo_id } = req.params;
    const query = "SELECT * FROM Teste WHERE copo_id = ?";
    connection.query(query, [copo_id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Nenhum teste encontrado para este copo." });
        }
        res.json(results);
    });
});

// Excluir um teste específico de um copo
router.delete("/testes/:teste_id", (req, res) => {
    const { teste_id } = req.params;

    // Verifica se existe o teste
    connection.query("SELECT * FROM Teste WHERE id = ?", [teste_id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Teste não encontrado." });
        }

        // Deleta o teste
        connection.query("DELETE FROM Teste WHERE id = ?", [teste_id], (err, delResults) => {
            if (err) return res.status(500).json({ error: err });

            res.status(200).json({ message: "Teste excluído com sucesso!" });
        });
    });
});

/*
======== INICIAR TESTE - Apenas registra o comando na tabela comando_teste ========
O IoT (ESP32) fará a leitura dos comandos pendentes via endpoint '/comando-pendente'.
Essa rota apenas insere a solicitação inicial.
*/
router.post('/testes', async (req, res) => {
    const { usuario_id, copos, tipo } = req.body;

    if (!usuario_id || !Array.isArray(copos) || copos.length === 0 || !tipo) {
        return res.status(400).json({ message: 'Usuário, copos e tipo são obrigatórios.' });
    }

    try {
        // Insere novo comando na tabela comando_teste com status 'pendente'
        // A coluna 'criado_em' deve ter um DEFAULT CURRENT_TIMESTAMP no banco
        await connection.query(`
            INSERT INTO comando_teste (usuario_id, copos, tipo, status)
            VALUES (?, ?, ?, 'pendente')
        `, [usuario_id, JSON.stringify(copos), tipo]);

        return res.status(201).json({ message: 'Solicitação de teste registrada! O IoT irá iniciar automaticamente.' });
    } catch (err) {
        console.error('[ERRO] Falha ao registrar teste:', err.message);
        return res.status(500).json({ message: 'Erro ao registrar teste.', erro: err.message });
    }
});

/*
======== GET /comando-pendente ========
Endpoint usado pelo IoT (ESP32) para buscar o próximo comando a ser executado.
Retorna o comando mais antigo com status 'pendente'.
*/
router.get('/comando-pendente', async (req, res) => {
    try {
        // BUSCA O PRIMEIRO COMANDO PENDENTE ORDENADO POR CRIAÇÃO
        // Para um único ESP32, esta query é suficiente.
        const [rows] = await connection.query(`
            SELECT id, usuario_id, copos, tipo
            FROM comando_teste
            WHERE status = 'pendente'
            ORDER BY criado_em ASC
            LIMIT 1
        `);

        if (rows.length) {
            // Retorna o comando encontrado
            res.json({ iniciar: true, comando: rows[0] });
        } else {
            // Não há comandos pendentes
            res.json({ iniciar: false });
        }
    } catch (err) {
        console.error('[ERRO] Falha ao buscar comando pendente:', err.message);
        return res.status(500).json({ message: 'Erro ao buscar comando pendente.', erro: err.message });
    }
});

/*
======== POST /comando-consumido ========
Endpoint usado pelo IoT (ESP32) para notificar que pegou um comando.
Atualiza o status do comando para 'executado'.
ADICIONADO: Validação para só atualizar se o status for 'pendente'.
*/
router.post('/comando-consumido', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'ID do comando é obrigatório.' });
    }

    try {
        // Primeiro, verifica o status atual do comando
        const [rows] = await connection.query('SELECT status FROM comando_teste WHERE id = ?', [id]);

        if (!rows.length) {
            // Comando não encontrado
            return res.status(404).json({ ok: false, message: "Comando não encontrado." });
        }

        if (rows[0].status !== 'pendente') {
            // Comando já foi consumido ou está em outro status
            // Retorna 409 Conflict para indicar que o estado atual não permite a operação
            console.warn(`[ALERTA] Tentativa de consumir comando ${id} que não está pendente (status: ${rows[0].status}).`);
            return res.status(409).json({ ok: false, message: "Comando já consumido ou não está pendente." });
        }

        // Se o status for 'pendente', atualiza para 'executado'
        const [updateResult] = await connection.query(`
            UPDATE comando_teste
            SET status = 'executado', executado_em = NOW()
            WHERE id = ? AND status = 'pendente' -- Garante que só atualiza se ainda for 'pendente'
        `, [id]);

        if (updateResult.affectedRows === 0) {
             // Rara, mas pode acontecer se outro processo atualizou entre o SELECT e o UPDATE
            console.warn(`[ALERTA] Conflito ao atualizar comando ${id}: 0 linhas afetadas.`);
            return res.status(409).json({ ok: false, message: "Conflito ao atualizar status do comando." });
        }

        console.log(`Comando ${id} marcado como executado.`);
        res.json({ ok: true, message: "Comando marcado como executado." });

    } catch (err) {
        console.error(`[ERRO] Falha ao marcar comando ${id} como consumido:`, err.message);
        return res.status(500).json({ message: 'Erro ao marcar comando como consumido.', erro: err.message });
    }
});

/*
======== RECEBER OS RESULTADOS DO TESTE (após as 2h, ESP32 envia os dados medidos) ========
Endpoint para registrar os resultados detalhados de um teste.
ADICIONADO: Prevenção contra inserção duplicada do mesmo resultado.
*/
// Função utilitária para converter ISO 8601 para formato MySQL DATETIME
function parseToMySQLDatetime(str) {
    if (!str) return null;
    // Cria objeto Date a partir da string ISO
    const d = new Date(str);
    if (isNaN(d.getTime())) return null; // Use getTime() para verificar validade
    // Retorna no formato 'YYYY-MM-DD HH:MM:SS'
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Rota para registrar resultado do teste
router.post('/resultadosTestes', async (req, res) => {
    const {
        usuario_id, copo_id, tipo,
        data_inicio, data_fim,
        t0, t10, t20, t30, t40, t50, t60, t70, t80, t90, t100, t110, t120, k
    } = req.body;

    // Validação básica de campos obrigatórios
    if (!usuario_id || !copo_id || !tipo || !data_inicio || !data_fim || t0 === undefined || k === undefined) {
        return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }

    // Converte datas para o formato aceito pelo MySQL e valida
    const data_inicio_mysql = parseToMySQLDatetime(data_inicio);
    const data_fim_mysql = parseToMySQLDatetime(data_fim);

    if (!data_inicio_mysql || !data_fim_mysql) {
        return res.status(400).json({ message: 'Formato de data/hora inválido.' });
    }

    try {
        // --- PREVENÇÃO DE DUPLICIDADE ---
        // Verifica se já existe um resultado para este usuário, copo e data de início.
        // Isso é crucial para evitar que o reenvio do ESP32 crie registros duplicados.
        const [existe] = await connection.query(
          "SELECT id FROM Teste WHERE usuario_id=? AND copo_id=? AND data_inicio=?",
          [usuario_id, copo_id, data_inicio_mysql]
        );

        if (existe.length > 0) {
          // Se já existe, retorna 409 Conflict (ou 200 OK se preferir ser idempotente)
          console.warn(`[ALERTA] Tentativa de inserir resultado duplicado para usuário ${usuario_id}, copo ${copo_id}, data ${data_inicio_mysql}.`);
          return res.status(409).json({ message: "Resultado de teste já registrado anteriormente." });
        }
        // --- FIM PREVENÇÃO DE DUPLICIDADE ---


        // Se não existe, procede com a inserção
        const sql = `
            INSERT INTO Teste (
                usuario_id, copo_id, tipo, data_inicio, data_fim,
                t0, t10, t20, t30, t40, t50, t60, t70, t80, t90, t100, t110, t120, k
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            usuario_id, copo_id, tipo, data_inicio_mysql, data_fim_mysql,
            t0, t10, t20, t30, t40, t50, t60, t70, t80, t90, t100, t110, t120, k
        ];

        const [result] = await connection.promise().query(sql, params);
        const insertId = result.insertId; // Use .insertId para obter o ID inserido

        console.log(`Resultado de teste ${insertId} registrado com sucesso.`);
        return res.status(201).json({ message: 'Resultado de teste registrado com sucesso!', teste_id: insertId });

    } catch (err) {
        console.error('[ERRO] Falha ao salvar resultados no banco:', err.message);
        return res.status(500).json({ message: 'Erro ao salvar resultados no banco.', erro: err.message });
    }
});

module.exports = router;