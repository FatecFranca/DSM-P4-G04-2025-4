import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../service/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    try {
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Validação adicional do usuário armazenado
        if (parsedUser && parsedUser.nome) {
          setUser(parsedUser);
        } else {
          // Limpar localStorage se o usuário estiver inválido
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Erro ao parsear usuário armazenado:', error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (nome, senha) => {
    // Validações de entrada
    if (!nome || !senha) {
      console.error('Nome e senha são obrigatórios');
      return false;
    }

    try {
      setLoading(true);
      
      // Alterado para '/usuarios/login'
      const response = await api.post('/usuarios', { nome, senha });
      console.log('Resposta do login:', response.data);
      
      // Verificar se a resposta contém dados de usuário
      if (response.data && response.data.nome) {
        // Remover campos sensíveis antes de armazenar
        const { senha: _, ...usuarioSeguro } = response.data;
        
        localStorage.setItem('user', JSON.stringify(usuarioSeguro));
        setUser(usuarioSeguro);
        return true;
      } else {
        console.log('Usuário não encontrado ou credenciais inválidas');
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratamento de diferentes tipos de erros
      if (error.response) {
        // Erro de resposta do servidor
        console.error('Erro de resposta:', error.response.data);
        
        // Adicionar tratamento específico de erros
        switch (error.response.status) {
          case 401:
            console.error('Credenciais inválidas');
            break;
          case 404:
            console.error('Usuário não encontrado');
            break;
          case 500:
            console.error('Erro interno do servidor');
            break;
          default:
            console.error('Erro desconhecido');
        }
      } else if (error.request) {
        // Erro de requisição
        console.error('Sem resposta do servidor');
      } else {
        // Erro de configuração
        console.error('Erro ao configurar a requisição');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Método de autenticação mais seguro
  const isAuthenticated = () => {
    // Verificação adicional de validade do usuário
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return false;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      return !!(parsedUser && parsedUser.nome);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      localStorage.removeItem('user');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: isAuthenticated(),
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
