// src/pages/CadCopo.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import theme from '../styles/theme';
import logoThermoTrack from '../images/logo_thermoTrack.png';

const CadCopo = () => {
  const [marca, setMarca] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [estado, setEstado] = useState('');
  const navigate = useNavigate();

  const handleCadastroCop = () => {
    if (!marca || !capacidade || !estado) {
      alert("Preencha todos os campos para cadastrar o copo!");
      return;
    }

    const novoCopo = { marca, capacidade, estado };

    try {
      const coposSalvos = localStorage.getItem("copos");
      let listaCopos = coposSalvos ? JSON.parse(coposSalvos) : [];
      
      listaCopos.push(novoCopo);
      localStorage.setItem("copos", JSON.stringify(listaCopos));

      alert("Copo cadastrado com sucesso!");
      navigate("/copos-cadastrados");
    } catch (error) {
      alert("Erro ao salvar copo!");
      console.error(error);
    }
  };

  const handleCoposCadastrados = () => {
    navigate("/copos-cadastrados");
  };

  return (
    <Container>
      <LogoContainer>
        <Logo src={logoThermoTrack} alt="Thermo Track Logo" />
      </LogoContainer>

      <FormContainer>
        <Title>Cadastro de Copos</Title>

        <InputGroup>
          <Label>Marca:</Label>
          <Select 
            value={marca} 
            onChange={(e) => setMarca(e.target.value)}
          >
            <option value="">Selecione a marca</option>
            <option value="Stanley">Stanley</option>
            <option value="Concorrente">Concorrente</option>
            <option value="Generico">Genérico</option>
          </Select>
        </InputGroup>

        <InputGroup>
          <Label>Capacidade:</Label>
          <Select 
            value={capacidade} 
            onChange={(e) => setCapacidade(e.target.value)}
          >
            <option value="">Selecione a capacidade</option>
            <option value="473">473 ml</option>
          </Select>
        </InputGroup>

        <InputGroup>
          <Label>Estado:</Label>
          <Select 
            value={estado} 
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Selecione o estado</option>
            <option value="Frio">Frio</option>
            <option value="Quente">Quente</option>
          </Select>
        </InputGroup>

        <ButtonGroup>
          <Button onClick={handleCadastroCop}>
            Cadastrar
          </Button>
          <Button secondary onClick={handleCoposCadastrados}>
            Copos Cadastrados
          </Button>
        </ButtonGroup>
      </FormContainer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${theme.colors.secondary};
  padding: 20px;
`;

const LogoContainer = styled.div`
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  width: 100%;
`;

const Logo = styled.img`
  max-width: 300px;
  height: auto;
  object-fit: contain;
`;

const FormContainer = styled.div`
  background-color: ${theme.colors.primary};
  width: 100%;
  max-width: 400px;
  padding: 30px;
  border-radius: ${theme.borderRadius.large};
  box-shadow: ${theme.shadows.medium};
`;

const Title = styled.h1`
  text-align: center;
  color: ${theme.colors.text.dark};
  margin-bottom: 25px;
  font-size: ${theme.fonts.sizes.large};
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: ${theme.colors.text.dark};
  font-weight: ${theme.fonts.weights.medium};
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border-radius: ${theme.borderRadius.normal};
  border: 2px solid ${theme.colors.secondary};
  background-color: ${theme.colors.secondary};
  color: ${theme.colors.text.light};
  font-size: ${theme.fonts.sizes.normal};
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Button = styled.button`
  padding: 15px;
  border: none;
  border-radius: ${theme.borderRadius.normal};
  background-color: ${props => 
    props.secondary 
      ? theme.colors.black 
      : theme.colors.secondary
  };
  color: ${theme.colors.text.light};
  font-size: ${theme.fonts.sizes.normal};
  font-weight: ${theme.fonts.weights.bold};
  cursor: pointer;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
`;

export default CadCopo;
