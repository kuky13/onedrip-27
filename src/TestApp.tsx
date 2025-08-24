import React from 'react';

const TestApp: React.FC = () => {
  console.log('🧪 TestApp renderizado');
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ color: '#fec832', marginBottom: '20px' }}>✅ Aplicação Teste Funcionando!</h1>
      <p style={{ marginBottom: '10px' }}>Se você consegue ver esta tela, o React está funcionando corretamente.</p>
      <p style={{ marginBottom: '20px' }}>O problema pode estar em algum componente específico da aplicação principal.</p>
      
      <div style={{
        backgroundColor: '#333',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#3ECF50', marginBottom: '10px' }}>Status dos Testes:</h3>
        <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0 }}>
          <li>✅ React carregado</li>
          <li>✅ CSS funcionando</li>
          <li>✅ JavaScript executando</li>
          <li>✅ Servidor de desenvolvimento ativo</li>
        </ul>
      </div>
      
      <button 
        onClick={() => {
          console.log('🔄 Redirecionando para aplicação principal...');
          window.location.href = '/';
        }}
        style={{
          backgroundColor: '#fec832',
          color: 'black',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        Voltar para Aplicação Principal
      </button>
    </div>
  );
};

export default TestApp;