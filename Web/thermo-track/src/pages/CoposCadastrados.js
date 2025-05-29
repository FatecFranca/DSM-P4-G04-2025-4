// src/pages/CoposCadastrados.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import theme from '../styles/theme';

// Importe as imagens
import copoGeloImage from '../images/copo_gelo.png';
import playImage from '../images/play.png';
import logoThermoTrack from '../images/logo_thermoTrack.png';

const CoposCadastrados = () => {
    const [copos, setCopos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const carregarCopos = () => {
            try {
                const coposSalvos = localStorage.getItem("copos");
                const listaCopos = coposSalvos ? JSON.parse(coposSalvos) : [];
                setCopos(listaCopos);
            } catch (error) {
                console.error("Erro ao buscar copos:", error);
                setCopos([]);
            }
        };

        carregarCopos();
    }, []);

    const removerCopo = (index) => {
        const novosCopos = [...copos];
        novosCopos.splice(index, 1);
        
        // Atualiza o estado local
        setCopos(novosCopos);
        
        // Atualiza o localStorage
        localStorage.setItem("copos", JSON.stringify(novosCopos));
    };

    const handleCadastroCop = () => {
        navigate("/cad-copo");
    };

    const gerarRelatorioCopo = (copo) => {
        navigate("/dashboard", { 
            state: { 
                copoDashboard: copo 
            } 
        });
    };

    return (
        <Container>
            <LogoContainer>
                <Logo src={logoThermoTrack} alt="Thermo Track Logo" />
            </LogoContainer>
            
            <ButtonContainer>
                <Button onClick={handleCadastroCop}>
                    Cadastrar novo copo
                </Button>
            </ButtonContainer>
            
            <ListaContainer>
                <Titulo>Copos Cadastrados:</Titulo>
                {copos.length === 0 ? (
                    <EmptyState>Nenhum copo cadastrado</EmptyState>
                ) : (
                    copos.map((item, index) => (
                        <ItemContainer key={index}>
                            <ItemDetails>
                                <ItemText>Marca: {item.marca}</ItemText>
                                <ItemText>Capacidade: {item.capacidade} ml</ItemText>
                                <ItemText>Estado: {item.estado}</ItemText>
                            </ItemDetails>
                            <ActionButtons>
                                <RelatorioButton onClick={() => gerarRelatorioCopo(item)}>
                                    Gerar Relatório
                                </RelatorioButton>
                                <RemoveButton onClick={() => removerCopo(index)}>
                                    Remover
                                </RemoveButton>
                            </ActionButtons>
                        </ItemContainer>
                    ))
                )}
            </ListaContainer>
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    background-color: ${theme.colors.secondary};
    padding: 20px;
`;

const LogoContainer = styled.div`
    margin-bottom: 20px;
    width: 100%;
    display: flex;
    justify-content: center;
`;

const Logo = styled.img`
    max-width: 300px;
    height: auto;
    object-fit: contain;
`;

const ButtonContainer = styled.div`
    width: 100%;
    max-width: 600px;
    margin-bottom: 20px;
`;

const Button = styled.button`
    width: 100%;
    padding: 15px;
    background-color: ${theme.colors.primary};
    color: ${theme.colors.text.dark};
    border: none;
    border-radius: ${theme.borderRadius.normal};
    font-size: ${theme.fonts.sizes.normal};
    font-weight: ${theme.fonts.weights.bold};
    cursor: pointer;
    transition: opacity 0.3s ease;

    &:hover {
        opacity: 0.8;
    }
`;

const ListaContainer = styled.div`
    width: 100%;
    max-width: 600px;
`;

const Titulo = styled.h2`
    color: ${theme.colors.primary};
    text-align: center;
    margin-bottom: 20px;
`;

const EmptyState = styled.div`
    text-align: center;
    color: ${theme.colors.primary};
    font-size: ${theme.fonts.sizes.normal};
`;

const ItemContainer = styled.div`
    background-color: ${theme.colors.primary};
    border-radius: ${theme.borderRadius.normal};
    padding: 15px;
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ItemDetails = styled.div`
    flex-grow: 1;
`;

const ItemText = styled.p`
    color: ${theme.colors.text.dark};
    margin-bottom: 5px;
`;

const ActionButtons = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const RelatorioButton = styled.button`
    background-color: ${theme.colors.secondary};
    color: ${theme.colors.text.light};
    border: none;
    border-radius: ${theme.borderRadius.small};
    padding: 8px 15px;
    font-size: ${theme.fonts.sizes.small};
    cursor: pointer;
    transition: opacity 0.3s ease;

    &:hover {
        opacity: 0.8;
    }
`;

const RemoveButton = styled.button`
    background-color: ${theme.colors.error};
    color: ${theme.colors.text.light};
    border: none;
    border-radius: ${theme.borderRadius.small};
    padding: 8px 15px;
    font-size: ${theme.fonts.sizes.small};
    cursor: pointer;
    transition: opacity 0.3s ease;

    &:hover {
        opacity: 0.8;
    }
`;

export default CoposCadastrados;
