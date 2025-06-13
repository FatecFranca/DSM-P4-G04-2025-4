import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';
import iconeUser from '../images/icone_user.png';

// Máscara para CPF
const formatCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const Login = () => {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Verificação de autenticação ao montar o componente
  useEffect(() => {
    console.log('Verificando autenticação', { isAuthenticated });
    if (isAuthenticated) {
      console.log('Usuário já autenticado, navegando para /cad-copo');
      navigate('/cad-copo');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Log detalhado do início do login
    console.log('Iniciando processo de login', {
      cpf: cpf,
      cpfLength: cpf.length,
      senhaLength: senha.length
    });

    // Limpar erros anteriores
    setError(null);

    // Validações de entrada
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    console.log('Validações de entrada', {
      cpfLimpo,
      cpfLimpoLength: cpfLimpo.length,
      senhaPreenchida: !!senha.trim()
    });

    if (!cpfLimpo) {
      console.warn('CPF não preenchido');
      setError('Por favor, insira seu CPF');
      return;
    }

    if (cpfLimpo.length !== 11) {
      console.warn('CPF inválido', { cpfLimpo });
      setError('CPF inválido');
      return;
    }

    if (!senha.trim()) {
      console.warn('Senha não preenchida');
      setError('Por favor, insira sua senha');
      return;
    }

    if (senha.length < 4) {
      console.warn('Senha muito curta', { senhaLength: senha.length });
      setError('Senha deve ter pelo menos 4 caracteres');
      return;
    }

    setLoading(true);

    try {
      console.log('Tentando realizar login');
      
      await login(cpfLimpo, senha);
      
      console.log('Login realizado com sucesso');
      // Navegação já tratada no contexto de autenticação
    } catch (error) {
      // Log detalhado do erro
      console.error('Erro completo durante o login:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      // Tratamento de erros mais direto
      switch (error.message) {
        case 'Usuário ou senha incorretos':
          console.warn('Credenciais incorretas');
          setError('CPF ou senha incorretos');
          break;
        case 'Usuário não encontrado':
          console.warn('Usuário não encontrado');
          setError('Usuário não encontrado');
          break;
        case 'CPF inválido':
          console.warn('CPF inválido no login');
          setError('Por favor, insira um CPF válido');
          break;
        default:
          console.error('Erro de login não mapeado');
          setError('Erro ao fazer login. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
      console.log('Processo de login finalizado');
    }
  };

  const handleCadastro = () => {
    console.log('Navegando para página de cadastro');
    navigate('/cad-user');
  };

  const handleCpfChange = (e) => {
    const valorFormatado = formatCPF(e.target.value);
    
    console.log('Alteração de CPF', {
      valorOriginal: e.target.value,
      valorFormatado
    });

    setCpf(valorFormatado);
    
    // Limpar erro específico de CPF
    if (error === 'Por favor, insira seu CPF' || error === 'CPF inválido') {
      setError(null);
    }
  };

  return (
    <Container>
      <LoginBox>
        <Logo src={iconeUser} alt="Ícone de Usuário" />
        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
        <Form onSubmit={handleLogin}>
          <Input
            type="text"
            placeholder="CPF"
            value={cpf}
            onChange={handleCpfChange}
            maxLength="14"
            disabled={loading}
            required
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => {
              console.log('Alteração de senha', { 
                senhaLength: e.target.value.length 
              });
              
              setSenha(e.target.value);
              
              // Limpar erro específico de senha
              if (
                error === 'Por favor, insira sua senha' ||
                error === 'Senha deve ter pelo menos 4 caracteres'
              ) {
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
            console.log('Clique em recuperação de senha');
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


// Componentes de estilo (mantidos inalterados)
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
  background-color: #f5f5f5; /* Fundo mais claro para contraste */
  color: #222;               /* Cor do texto digitado */
  /* opacity: 0.8; */         /* Não use opacity */
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
