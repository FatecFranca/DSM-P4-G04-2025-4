import axios from 'axios';

// URL base da API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://13.68.97.186:4000';
console.log('BASE_URL configurada:', BASE_URL); // Log para verificar a URL

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
    console.log('Configuração da requisição:', config.url); // Log da URL da requisição
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser.token) {
          config.headers['Authorization'] = `Bearer ${parsedUser.token}`;
          console.log('Token adicionado à requisição'); // Log de token
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
    console.log('Resposta da API:', response.data); // Log de resposta bem-sucedida
    return response;
  },
  error => {
    console.error('Erro na requisição:', error);
    
    if (error.response) {
      // Erros com resposta do servidor
      console.error('Dados do erro:', error.response.data);
      console.error('Status do erro:', error.response.status);
      
      // Tratamento específico para erros de autenticação
      if (error.response.status === 401) {
        console.log('Sessão expirada. Fazendo logout.');
        localStorage.removeItem('user');
        // Redirecionar para login, se necessário
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Erros sem resposta
      console.error('Sem resposta do servidor');
      console.error('Detalhes da requisição:', error.request);
    } else {
      // Outros erros
      console.error('Erro ao configurar a requisição');
    }
    
    return Promise.reject(error);
  }
);

// Método adicional de login para centralizar lógica
export const loginUser = async (nome, senha) => {
  try {
    const response = await api.post('/usuarios', { nome, senha });
    return response.data;
  } catch (error) {
    console.error('Erro de login:', error);
    throw error;
  }
};

export default api;
