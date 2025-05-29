import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';
import iconeUser from '../images/icone_user.png';

const Login = () => {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Verificação de autenticação ao montar o componente
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/cad-copo');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setError(null);

    // Validações de entrada
    if (!nome.trim()) {
      setError('Por favor, insira seu nome');
      return;
    }

    if (!senha.trim()) {
      setError('Por favor, insira sua senha');
      return;
    }

    setLoading(true);

    try {
      const success = await login(nome, senha);
      
      if (success) {
        // Navegação após login bem-sucedido
        navigate('/cad-copo');
      } else {
        setError('Usuário ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro durante o login:', error);
      
      // Mensagens de erro mais específicas
      if (error.response) {
        switch (error.response.status) {
          case 401:
            setError('Credenciais inválidas');
            break;
          case 404:
            setError('Usuário não encontrado');
            break;
          case 500:
            setError('Erro interno do servidor. Tente novamente mais tarde.');
            break;
          default:
            setError('Erro ao fazer login. Verifique sua conexão.');
        }
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Erro ao fazer login. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = () => {
    navigate('/cad-user');
  };

  return (
    <Container>
      <LoginBox>
        <Logo src={iconeUser} alt="Ícone de Usuário" />
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleLogin}>
          <Input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              // Limpar erro específico de nome
              if (error === 'Por favor, insira seu nome') {
                setError(null);
              }
            }}
            disabled={loading}
            required
            autoComplete="username"
          />
          
          <Input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              // Limpar erro específico de senha
              if (error === 'Por favor, insira sua senha') {
                setError(null);
              }
            }}
            disabled={loading}
            required
            autoComplete="current-password"
          />
          
          <ButtonGroup>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            
            <Button
              type="button"
              onClick={handleCadastro}
              disabled={loading}
            >
              Cadastrar
            </Button>
          </ButtonGroup>
        </Form>
        
        <ForgotPasswordLink 
          onClick={() => {
            // Implementar lógica de recuperação de senha
            alert('Funcionalidade de recuperação de senha em desenvolvimento');
          }}
        >
          Esqueceu sua senha?
        </ForgotPasswordLink>
      </LoginBox>
    </Container>
  );
};

// Componentes de estilo
const ErrorMessage = styled.div`
  background-color: #ff4d4f;
  color: white;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
  width: 100%;
  max-width: 250px;
  animation: shake 0.5s;

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: ${theme.colors.secondary};
`;

const LoginBox = styled.div`
  background-color: ${theme.colors.primary};
  width: 90%;
  max-width: 400px;
  padding: 40px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
`;

const Logo = styled.img`
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  max-width: 250px;
  padding: 10px;
  margin: 10px 0;
  border: 2px solid black;
  border-radius: 10px;
  background-color: ${theme.colors.secondary};
  color: ${theme.colors.text.light};
  opacity: 0.8;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 250px;
`;

const Button = styled.button`
  background-color: black;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px;
  width: 100%;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.3s ease;
  &:disabled {
    background-color: #666;
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ForgotPasswordLink = styled.p`
  color: ${theme.colors.text.dark};
  margin-top: 15px;
  font-size: 0.9em;
  cursor: pointer;
  text-decoration: underline;
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

export default Login;
