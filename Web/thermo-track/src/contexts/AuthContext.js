import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../service/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificação de usuário armazenado ao iniciar
  useEffect(() => {
    console.log('Iniciando verificação de usuário armazenado');
    const storedUser = localStorage.getItem('user');
    
    try {
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // Verificação de expiração do token
        const now = new Date().getTime();
        if (parsedUser.tokenExpiration && now > parsedUser.tokenExpiration) {
          console.warn('Token expirado');
          localStorage.removeItem('user');
          setUser(null);
        } else if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          console.log('Usuário autenticado recuperado');
        } else {
          console.warn('Usuário armazenado inválido');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('Nenhum usuário armazenado');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário armazenado:', {
        message: error.message,
        stack: error.stack
      });
      
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
      console.log('Verificação de usuário concluída');
    }
  }, []);

  // Método de login
  const login = async (cpf, senha) => {
    console.log('Iniciando login de usuário', { cpf });

    // Limpeza e validação de CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
   
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      console.warn('CPF inválido', { cpfLimpo });
      throw new Error('CPF inválido');
    }

    if (!senha.trim()) {
      console.warn('Senha não preenchida');
      throw new Error('Senha é obrigatória');
    }

    try {
      setLoading(true);
      console.log('Tentando login de usuário');
      
      const usuario = await loginUser(cpfLimpo, senha);
      
      // Validação adicional de retorno
      if (!usuario || !usuario.id) {
        throw new Error('Dados de usuário inválidos');
      }

      // Adicionar timestamp de expiração (24 horas)
      const userWithExpiration = {
        ...usuario,
        tokenExpiration: new Date().getTime() + (24 * 60 * 60 * 1000)
      };

      // Armazenar usuário
      localStorage.setItem('user', JSON.stringify(userWithExpiration));
      setUser(userWithExpiration);
      
      console.log('Login realizado com sucesso');
      
      // Navegar após login
      navigate('/cad-copo');
      
      return true;
    } catch (error) {
      // Log detalhado de erro
      console.error('Erro completo no login:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      // Mapeamento de erros
      const errorMap = {
        'Credenciais inválidas': 'Usuário ou senha incorretos',
        'Usuário não encontrado': 'Usuário não encontrado',
        'CPF inválido': 'Por favor, insira um CPF válido',
      };

      const mappedErrorMessage = errorMap[error.message] || 'Erro ao fazer login';
      throw new Error(mappedErrorMessage);
    } finally {
      setLoading(false);
      console.log('Processo de login finalizado');
    }
  };

  // Método de logout
  const logout = () => {
    console.log('Realizando logout');
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Método de refresh de token (opcional)
  const refreshToken = async () => {
    try {
      // Verificar se há um usuário logado
      if (!user) return false;

      // Lógica para obter novo token 
      // NOTA: Implemente a chamada real à API de refresh
      // const newToken = await api.refreshToken(user.refreshToken);
      
      const now = new Date().getTime();
      const updatedUser = { 
        ...user, 
        // token: newToken, // Descomentar quando implementar
        tokenExpiration: now + (24 * 60 * 60 * 1000)
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return true;
    } catch (error) {
      console.error('Erro ao atualizar token:', error);
      logout(); // Fazer logout em caso de erro
      return false;
    }
  };

  // Provedor de contexto
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshToken,
        isAuthenticated: !!user, // Conversão para booleano
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para uso do contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

export default AuthContext;
