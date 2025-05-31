import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../service/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Iniciando verificação de usuário armazenado');
    const storedUser = localStorage.getItem('user');
    
    try {
      if (storedUser) {
        console.log('Usuário armazenado encontrado');
        const parsedUser = JSON.parse(storedUser);
        
        console.log('Dados do usuário armazenado:', {
          temId: !!parsedUser.id,
          propriedades: Object.keys(parsedUser)
        });

        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          console.log('Usuário definido no contexto');
        } else {
          console.warn('Usuário armazenado inválido');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('Nenhum usuário armazenado');
      }
    } catch (error) {
      console.error('Erro detalhado ao parsear usuário:', {
        message: error.message,
        stack: error.stack,
        storedUserString: storedUser
      });
      
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
      console.log('Verificação de usuário concluída');
    }
  }, []);

  const login = async (cpf, senha) => {
  console.log('Iniciando login de usuário', { 
    cpf, 
    senhaLength: senha.length 
  });

  // Validações de entrada
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  console.log('Validações de entrada', {
    cpfLimpo,
    cpfLimpoLength: cpfLimpo.length,
    senhaPreenchida: !!senha.trim()
  });

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
    
    console.log('Retorno do login:', {
      usuarioRecebido: !!usuario,
      propriedades: usuario ? Object.keys(usuario) : 'Sem usuário'
    });

    localStorage.setItem('user', JSON.stringify(usuario));
    setUser(usuario);
    
    console.log('Login realizado com sucesso');
    
    // Navega após login bem-sucedido
    navigate('/cad-copo');
    
    return true;
  } catch (error) {
    // Log detalhado de erro
    console.error('Erro completo no login:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    // Mapeamento de erros mais específico
    switch (error.message) {
      case 'Credenciais inválidas':
        console.warn('Credenciais inválidas');
        throw new Error('Usuário ou senha incorretos');
      
      case 'Usuário não encontrado':
        console.warn('Usuário não encontrado');
        throw new Error('Usuário não encontrado');
      
      case 'CPF inválido':
        console.warn('CPF inválido no login');
        throw new Error('Por favor, insira um CPF válido');
      
      default:
        console.error('Erro de login não mapeado');
        throw new Error('Erro ao fazer login');
    }
  } finally {
    setLoading(false);
    console.log('Processo de login finalizado');
  }
};


  const logout = () => {
    console.log('Realizando logout');
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAuthenticated = () => {
    console.log('Verificando autenticação');
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      console.log('Sem usuário armazenado');
      return false;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      
      console.log('Verificação de autenticação', {
        temId: !!parsedUser.id,
        propriedades: Object.keys(parsedUser)
      });

      return !!(parsedUser && parsedUser.id);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', {
        message: error.message,
        storedUser
      });
      
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
