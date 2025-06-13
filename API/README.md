# API - ThermoTrack ⚙️

## Visão Geral
Este diretório contém o código-fonte e a documentação da API backend para o projeto ThermoTrack.
A API é responsável por receber dados dos dispositivos IoT (como os sensores de temperatura com ESP32), armazená-los em um banco de dados e fornecer endpoints para que o frontend web e outras aplicações possam consumir e interagir com essas informações.

## Tecnologias Utilizadas
- **Linguagem/Runtime:** Node.js 
- **Framework:** Express.js
- **Banco de Dados:** MySQL(porta 3306)
- **Template:** EJS (renderizar páginas dinâmicas no front end)
- **Mecanismo de Segurança:** CORS (controlar recursos entre diferentes domínios)
- **Ambiente de Hospedagem:** Máquina Virtual (VM) no Microsoft Azure.

## Integrantes do Grupo


- **Wilton Monteiro**- Designer/Front-end
- **Thiago Resende** - Full-stack
- **Danilo Benedetti** - Back-end/IoT
- **Gustavo Monteiro** - Front-end


## Informações da VM Azure
- **Sistema Operacional:** Linux (Ubuntu 24.04 LTS)
- **Endereço IP Público:** `13.68.97.186`
- **Nome DNS (se configurado):** `http://13.68.97.186:4000/`
- **Regras de Porta de Entrada (Inbound) configuradas:**
    - `22/TCP` (SSH para acesso à VM)
    - `80/TCP` (HTTP para o front-end web)
    - `443/TCP` (HTTPS para o front-end web seguro)
    - `3306/TCP` (Para acesso ao MySQL)
    - `4000/TCP` (Para a nossa API Node.js)

## Como Executar a API na VM

### Pré-requisitos na VM
- Node.js e npm (ou Yarn) instalados.
- Git instalado (para clonar/atualizar o repositório).
- Servidor do Banco de Dados (MySQL) configurado e rodando (ou acessível).

### Passos para Deploy/Execução
1.  **Acessar a VM via SSH:**
    ```bash
    ssh danilopi@13.68.97.186
    ```
    A senha de acesso está armazenada em um arquivo .env no servidor.

2.  **Instalar/Atualizar Dependências (se necessário):**
    Se houveram mudanças no `package.json` ou é o primeiro deploy:
    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente:**
    A API precisará de um arquivo `.env` na raiz do diretório com as configurações do banco de dados e outras chaves. Veja a seção "Arquivo `.env`" abaixo para o conteúdo.
    **Este arquivo `.env` NUNCA deve ser enviado para o Git!** Adicione `.env` ao seu arquivo `.gitignore`.

4.  **Iniciar a API:**:
    * Usando o script:
        ```bash
        ./api.sh
        ```
    * Ou, se o script não estiver disponível ou você precisar rodar manualment:
        ```bash
        nodemon index.js
        ```
    A API deve ficar disponível em `http://13.68.97.186:4000`.

## Endpoints da API
O endereço base para acessar a API é: `http://13.68.97.186:4000`

### Exemplo de Endpoint já existente:
-   **`GET /usuarios`**: Retorna uma lista de usuários cadastrados.
    -   **Exemplo de Resposta (JSON):**
        ```json
        [
          {
            "id": 1,
            "nome": "João da Silva",
            "senha": "xxxx", 
            "cpf": "99999999999",
            "email": "joaosilva@thermotrack.com"
          },
          {
            "id": 2,
            "nome": "José das Couves",
            "senha": "xxxx",
            "cpf": "11111111111",
            "email": "jose@thermotrack.com"
          }
          // ...e assim por diante
        ]
        ```

**(Aqui vocês devem listar todos os outros endpoints que a API terá, por exemplo: `POST /dados_iot`, `GET /dados_iot/recente`, etc., com detalhes sobre métodos, parâmetros e exemplos de corpos de requisição/resposta.)**

## Configuração do Banco de Dados
- A API se conecta a um banco de dados MySQL (porta `3306`).
- As credenciais de acesso (host, usuário, senha, nome do banco) devem ser configuradas no arquivo `.env`.

## Arquivo `.env` 
É um arquivo `.env` que está na raiz da `VM` com as credenciais de acesso.

## Configurações da Aplicação/API
```
- API_PORT=4000
- NODE_ENV=development # ou production, testing
```

## Configurações do Banco de Dados (MySQL)
```
DB_HOST=localhost # Ou o IP/host do servidor de banco de dados (pode ser 127.0.0.1 se estiver na mesma VM)
DB_USER=seu_usuario_do_banco
DB_PASSWORD=sua_senha_forte_do_banco
DB_NAME=thermotrack_db # Nome do banco de dados da aplicação
DB_PORT=3306
```

## Credenciais da VM
```
- VM_HOST=13.68.97.186
- VM_USER=danilopi
- VM_PASSWORD=FatecFranca123*
```

### Estas informações somente foram divulgadas quando a VM já não estava mais no ar!
