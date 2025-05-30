import axios from 'axios';

// URL base da API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://13.68.97.186:4000/api';
console.log('BASE_URL configurada:', BASE_URL);

// Cria uma instância do axios com a URL base
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação (se existir)
api.interceptors.request.use(
  config => {
    console.log('Configuração da requisição:', config.url);
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser.token) {
          config.headers['Authorization'] = `Bearer ${parsedUser.token}`;
          console.log('Token adicionado à requisição');
        }
      } catch (error) {
        console.error('Erro ao parsear usuário:', error);
      }
    }
    return config;
  },
  error => {
    console.error('Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

// Tratamento de erros padrão
api.interceptors.response.use(
  response => {
    console.log('Resposta da API:', response.data);
    return response;
  },
  error => {
    console.error('Erro na requisição:', error);
    if (error.response) {
      console.error('Dados do erro:', error.response.data);
      console.error('Status do erro:', error.response.status);
      
      if (error.response.status === 401) {
        console.log('Sessão expirada. Fazendo logout.');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('Sem resposta do servidor');
      console.error('Detalhes da requisição:', error.request);
    } else {
      console.error('Erro ao configurar a requisição');
    }
    return Promise.reject(error);
  }
);

// Métodos de Usuário
export const loginUser = async (cpf, senha) => {
  try {
    const response = await api.post('/usuarios/login', { cpf, senha });
    return response.data;
  } catch (error) {
    console.error('Erro de login:', error);
    throw error;
  }
};

export const cadastrarUsuario = async (nome, cpf, email, senha) => {
  try {
    const response = await api.post('/usuarios', { nome, cpf, email, senha });
    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    throw error;
  }
};

export const buscarUsuarios = async () => {
  try {
    const response = await api.get('/usuarios');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
};

export const alterarSenha = async (cpf, email, novaSenha) => {
  try {
    const response = await api.put('/usuarios/senha', { cpf, email, novaSenha });
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    throw error;
  }
};

// Métodos de Copo
export const cadastrarCopo = async (usuario_id, nome, marca, capacidade_ml) => {
  try {
    const response = await api.post('/copos', { usuario_id, nome, marca, capacidade_ml });
    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar copo:', error);
    throw error;
  }
};

export const buscarCoposPorUsuario = async (usuario_id) => {
  try {
    const response = await api.get(`/copos/usuario/${usuario_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar copos:', error);
    throw error;
  }
};

export const atualizarCopo = async (copo_id, dadosAtualizacao) => {
  try {
    const response = await api.put(`/copos/${copo_id}`, dadosAtualizacao);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar copo:', error);
    throw error;
  }
};

export const excluirCopo = async (copo_id) => {
  try {
    const response = await api.delete(`/copos/${copo_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir copo:', error);
    throw error;
  }
};

// Métodos de Teste
export const iniciarTeste = async (usuario_id, copos, tipo) => {
  try {
    const response = await api.post('/testes', { usuario_id, copos, tipo });
    return response.data;
  } catch (error) {
    console.error('Erro ao iniciar teste:', error);
    throw error;
  }
};

export const buscarTestesPorCopo = async (copo_id) => {
  try {
    const response = await api.get(`/testes/copo/${copo_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar testes:', error);
    throw error;
  }
};

export const excluirTeste = async (teste_id) => {
  try {
    const response = await api.delete(`/testes/${teste_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir teste:', error);
    throw error;
  }
};

export default api;
