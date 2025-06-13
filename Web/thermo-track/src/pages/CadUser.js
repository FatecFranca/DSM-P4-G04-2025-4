import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { cadastrarUsuario } from '../service/api';
import theme from '../styles/theme';

// Função de máscara para CPF
const formatCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const CadUser = () => {
  const [formData, setFormData] = useState({
    nome: '',
    senha: '',
    cpf: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Tratamento especial para CPF
    const updatedValue = name === 'cpf' 
      ? formatCPF(value) 
      : value;

    setFormData(prevState => ({
      ...prevState,
      [name]: updatedValue
    }));
    
    // Limpar erros ao modificar campos
    setError(null);
  };

  // Validações de campos
  const validateForm = () => {
    const { nome, senha, cpf, email } = formData;
    
    // Validação de nome
    if (nome.length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return false;
    }
    
    // Validação de senha
    if (senha.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    // Validação de CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setError('CPF inválido. Digite 11 dígitos');
      return false;
    }
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email inválido');
      return false;
    }
    
    return true;
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setError(null);
    
    // Validar campos
    if (!validateForm()) {
      return;
    }
    
    // Preparar dados para envio
    const dadosCadastro = {
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ''), // Enviar CPF apenas com números
    };

    setLoading(true);
    
    try {
      // Cadastrar novo usuário
      const response = await cadastrarUsuario(
        dadosCadastro.nome, 
        dadosCadastro.cpf, 
        dadosCadastro.email, 
        dadosCadastro.senha
      );
      
      // Log do usuário cadastrado
      console.log('Usuário cadastrado:', response);
      
      // Feedback de sucesso
      alert('Usuário cadastrado com sucesso!');
      
      // Navegação
      navigate('/login');
    } catch (error) {
      // Tratamento detalhado de erro
      console.error('Erro ao cadastrar usuário:', error);
      
      if (error.response) {
        // O servidor respondeu com um status de erro
        setError(
          error.response.data.message || 
          `Erro ${error.response.status}: Falha no cadastro`
        );
      } else if (error.request) {
        // A requisição foi feita, mas não houve resposta
        setError('Sem resposta do servidor. Verifique sua conexão.');
      } else {
        // Algo aconteceu ao configurar a requisição
        setError('Erro ao processar o cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Restante do código de estilização permanece igual
  return (
    <Container>
      <CadastroBox>
        <Titulo>CADASTRO DE USUÁRIO</Titulo>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={handleCadastro}>
          <Input
            type="text"
            name="nome"
            placeholder="Nome"
            value={formData.nome}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
          <Input
            type="password"
            name="senha"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
          <Input
            type="text"
            name="cpf"
            placeholder="CPF"
            value={formData.cpf}
            onChange={handleInputChange}
            disabled={loading}
            maxLength="14"
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </Form>
      </CadastroBox>
    </Container>
  );
};
// Componente de mensagem de erro
const ErrorMessage = styled.div`
  background-color: #ff4d4f;
  color: white;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
  width: 100%;
  max-width: 250px;
`;

// Styled components restantes permanecem iguais
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: ${theme.colors.secondary};
`;

// ... (restante dos styled components)



const CadastroBox = styled.div`
  background-color: ${theme.colors.primary};
  width: 90%;
  max-width: 400px;
  padding: 40px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
`;

const Titulo = styled.h1`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text.dark};
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
  /* opacity: 0.8; */         /* Removido para não afetar o placeholder e o cursor */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  background-color: black;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px;
  width: 100%;
  max-width: 250px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.3s ease;
  margin-top: 10px;

  &:disabled {
    background-color: #666;
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default CadUser;
