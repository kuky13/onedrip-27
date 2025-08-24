import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import TestApp from './TestApp.tsx';
import './index.css';

// Debug: Adicionar logs para identificar problemas
console.log('🚀 Iniciando aplicação React...');

// Capturar erros não tratados
window.addEventListener('error', (event) => {
  console.error('❌ Erro não tratado:', event.error);
  console.error('Stack trace:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rejeitada:', event.reason);
});

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Elemento root não encontrado!');
  }
  
  console.log('✅ Elemento root encontrado:', rootElement);
  
  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ Root do React criado');
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  
  console.log('✅ Aplicação renderizada com sucesso!');
} catch (error) {
  console.error('❌ Erro ao inicializar aplicação:', error);
  
  // Mostrar erro na tela
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: #121212;
        color: white;
        font-family: Arial, sans-serif;
        padding: 20px;
        text-align: center;
      ">
        <h1 style="color: #ff4444; margin-bottom: 20px;">❌ Erro ao carregar aplicação</h1>
        <p style="margin-bottom: 10px;">Detalhes do erro:</p>
        <pre style="
          background-color: #333;
          padding: 15px;
          border-radius: 5px;
          max-width: 80%;
          overflow: auto;
          white-space: pre-wrap;
        ">${error.message}\n\n${error.stack || ''}</pre>
        <button onclick="window.location.reload()" style="
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #fec832;
          color: black;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">Recarregar Página</button>
      </div>
    `;
  }
}