
<div align="center">
  <img src="/public/lovable-uploads/logoo.png" alt="OneDrip Logo" width="120" height="120">
  
  # OneDrip - Sistema de Gestão Profissional

  ### *Plataforma completa para assistências técnicas modernas*
  
  [![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/License-Restricted-red?style=for-the-badge)](./LICENSE)
  [![Security](https://img.shields.io/badge/Security-Hardened-green?style=for-the-badge&logo=shield)](./SECURITY.md)
  
  ---
</div>

## 📋 **Índice**

- [Sobre o OneDrip](#-sobre-o-onedrip)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Acesso ao Sistema](#-acesso-ao-sistema)
- [Instalação e Desenvolvimento](#-instalação-e-desenvolvimento)
- [Arquitetura Técnica](#️-arquitetura-técnica)
- [Diferenciais Competitivos](#-diferenciais-competitivos)
- [Roadmap de Desenvolvimento](#-roadmap-de-desenvolvimento)
- [Contribuição](#-contribuição)
- [Licença & Suporte](#-licença--suporte)

## ✨ **Sobre o OneDrip**

> **"O sistema mais completo e moderno para gestão de assistências técnicas"**

O **OneDrip** é uma plataforma SaaS desenvolvida especificamente para assistências técnicas que desejam **profissionalizar** e **otimizar** suas operações. Com tecnologia de ponta e interface intuitiva, oferece tudo que você precisa para transformar seu negócio.

---

## 🎯 **Funcionalidades Principais**

### 📋 **Sistema de Orçamentos Avançado**
- ✅ **Criação Inteligente**: Templates personalizáveis com cálculos automáticos
- ✅ **Workflow Completo**: Novo → Aprovado → Pago → Entregue → Concluído
- ✅ **Geração de PDF**: Orçamentos profissionais com identidade visual
- ✅ **Busca Avançada**: Filtros por status, cliente, período, dispositivo
- ✅ **Alertas de Vencimento**: Notificações automáticas para orçamentos expirados
- ✅ **Gestão de Partes**: Controle detalhado de peças e serviços

### 👥 **Gestão Completa de Clientes**
- 🔍 **Cadastro Completo**: Dados pessoais, contato e histórico
- 📱 **Integração WhatsApp**: Envio direto de orçamentos
- 📊 **Histórico Detalhado**: Todos os orçamentos por cliente
- 🏷️ **Tags e Categorias**: Organização avançada da base de clientes

### 📊 **Dashboard Analytics Avançado**
- 📈 **Métricas em Tempo Real**: Vendas, conversões e performance
- 📅 **Relatórios Semanais**: Crescimento e estatísticas

### 🗂️ **Gestão de Dados e Backup**
- 💾 **Exportação/Importação**: CSV, Excel, PDF
- 🗑️ **Lixeira Inteligente**: Recuperação de dados excluídos (90 dias)
- 🔄 **Backup Automático**: Seus dados sempre seguros

### 🏢 **Gestão Empresarial Multi-usuário**
- 🎨 **Personalização Total**: Logo, informações da empresa
- 🔒 **Segurança Avançada**: Criptografia e auditoria
- 📱 **100% Responsivo**: Otimizado para iOS, Android e Desktop

### ⚙️ **Painel Administrativo**
- 🔧 **Gestão de Usuários**: Criar, editar, renovar licenças
- 📊 **Logs do Sistema**: Auditoria completa de ações
- 🌐 **Configurações do Site**: Personalização da página de planos

---

## 🚀 **Acesso ao Sistema**

### **Demo Online**
```bash
🌐 URL: https://kuky.pro
📧 Usuário: caipora@kuky.cloud
🔑 Senha: caipora
```

### **Página de Planos**
```bash
💰 Planos: https://kuky.pro/plans
📱 Suporte: WhatsApp (64) 9602-8022
```

---

## 🛠️ **Instalação e Desenvolvimento**

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Git

### **Configuração do Ambiente**

1. **Clone o repositório**
```bash
git clone https://github.com/kukysolutions/onedrip-system.git
cd onedrip-system
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. **Execute o projeto em desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

5. **Acesse o sistema**
```
http://localhost:5173
```

### **Scripts Disponíveis**

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera build de produção
npm run preview      # Visualiza o build de produção
npm run lint         # Executa o linter
npm run type-check   # Verifica tipos TypeScript
```

### **Estrutura de Branches**

- `main` - Produção estável
- `develop` - Desenvolvimento ativo
- `feature/*` - Novas funcionalidades
- `hotfix/*` - Correções urgentes

---

## 🏗️ **Arquitetura Técnica**

### **Stack Principal**
```
🌐 Frontend
├── React 18.3.1 + TypeScript 5.5.2
├── Vite 5.4.1 (Build Tool)
├── Tailwind CSS 3.4.1 (Design System)
├── TanStack Query 5.56.2 (State Management)
├── React Router 6.26.2 (Routing)
├── Framer Motion 12.23.0 (Animations)
└── Radix UI (Component Library)

🗄️ Backend (Supabase)
├── 🔐 Authentication & Authorization
├── 📊 PostgreSQL Database
├── 📁 File Storage
├── ⚡ Real-time Webhooks
└── 🔒 Row Level Security (RLS)

🎨 UI/UX
├── Design System Personalizado
├── Componentes Reutilizáveis
├── Otimizações para iOS/Android
└── Responsividade Total
```

### **Estrutura do Projeto**
```
src/
├── components/          # Componentes reutilizáveis
│   ├── adaptive/       # Componentes responsivos
│   ├── budgets/        # Sistema de orçamentos
│   ├── dashboard/      # Dashboard e analytics
│   ├── lite/          # Versão mobile otimizada
│   ├── ui/            # Design system
│   └── UserManagement/ # Gestão de usuários
├── hooks/              # Custom hooks
├── pages/              # Páginas principais
├── plans/              # Sistema de planos
├── utils/              # Utilitários
└── integrations/       # Integrações externas
```

---

## 💎 **Diferenciais Competitivos**

<div align="center">

| **OneDrip** | **Concorrentes** |
|:----------:|:----------------:|
| ✅ **Interface Moderna** | ❌ Design Ultrapassado |
| ✅ **Preço Acessível (R$ 45/mês)** | ❌ Mensalidades Altas |
| ✅ **Suporte Brasileiro** | ❌ Suporte Limitado |
| ✅ **Atualizações Constantes** | ❌ Funcionalidades Estáticas |
| ✅ **Sistema Completo** | ❌ Funcionalidades Limitadas |
| ✅ **Otimizado para Mobile** | ❌ Apenas Desktop |

</div>

---

## 🚀 **Roadmap de Desenvolvimento**

### ✅ **Versão 2.0 - Blue Barry** - *Atual*
- [x] Sistema completo de orçamentos com workflow
- [x] Dashboard analytics avançado
- [x] Geração de PDF profissional
- [x] Gestão completa de clientes
- [x] Lixeira inteligente com recuperação
- [x] Exportação/Importação de dados
- [x] Painel administrativo completo
- [x] Otimizações para iOS/Android

### 🔄 **Versão 3.0 - Ice Cream** - *Em Desenvolvimento*
- [ ] **API WhatsApp Integrada**: Envio automático de orçamentos
- [ ] **Alertas Inteligentes**: Notificações de vencimento
- [ ] **Relatórios Avançados**: Business Intelligence
- [ ] **Integração com Sistemas Externos**: ERP, E-commerce
- [ ] **Métricas Avançadas**: Conversion tracking

### 🎯 **Versão 4.0 - Pão de Queijo** - *Planejado*
- [ ] **IA Assistant**: Diagnósticos automáticos com machine learning
- [ ] **Marketplace**: Peças e fornecedores integrados
- [ ] **Agenda Online**: Agendamento para clientes
- [ ] **Sistema de Notas Fiscais**: Integração com SEFAZ

---

## 🤝 **Contribuição**

Valorizamos sua participação no desenvolvimento do OneDrip! Existem várias formas de contribuir:

### **Como Contribuir**

1. **Reporte Bugs**: Use as [Issues](https://github.com/kukysolutions/onedrip-system/issues) para reportar problemas
2. **Sugira Melhorias**: Compartilhe suas ideias para novas funcionalidades
3. **Documentação**: Ajude a melhorar nossa documentação
4. **Testes**: Contribua com testes automatizados

### **Processo de Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### **Conecte-se Conosco**

**Compartilhe suas ideias!** Envie suas sugestões de melhorias ou reportes de problemas em nossa comunidade:

<div align="center">

[![WhatsApp Community](https://img.shields.io/badge/WhatsApp_Community-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://chat.whatsapp.com/GPwLAJHurVnA0fJa9aWlEL)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](#)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:suporte@onedrip.com)
[![GitHub Issues](https://img.shields.io/badge/GitHub_Issues-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kukysolutions/onedrip-system/issues)

</div>

---

## 📄 **Licença & Suporte**

### **Licenciamento**
📋 Este projeto é licenciado sob a **Licença de Uso Restrito Oliver System** - veja [LICENSE](LICENSE) para detalhes.

### **Suporte Técnico**
- 📞 **WhatsApp**: (64) 9602-8022
- 📧 **E-mail**: suporte@onedrip.com.br
- 🕐 **Horário**: Segunda à Sexta, 8h às 18h

---

<div align="center">

## 🌟 **Transforme sua Assistência Técnica Hoje!**

**Junte-se a centenas de profissionais que já escolheram o OneDrip**

[![Começar Agora](https://img.shields.io/badge/🚀_COMEÇAR_AGORA-4CAF50?style=for-the-badge&logoColor=white)](https://kuky.pro/plans)
[![Demo Gratuita](https://img.shields.io/badge/🎯_DEMO_GRATUITA-2196F3?style=for-the-badge&logoColor=white)](https://kuky.pro)

---

## 🏆 **Reconhecimentos**

- **Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)**
- **Powered by [Supabase](https://supabase.com)** - Backend as a Service
- **UI Components by [Radix UI](https://radix-ui.com)** - Primitivos acessíveis
- **Styling by [Tailwind CSS](https://tailwindcss.com)** - Framework CSS utilitário

## 📊 **Estatísticas do Projeto**

- **Linhas de Código**: 50,000+
- **Componentes React**: 200+
- **Hooks Customizados**: 30+
- **Páginas**: 15+
- **Tempo de Desenvolvimento**: 6+ meses

## 🌟 **Agradecimentos Especiais**

Agradecemos a todos que contribuíram para o desenvolvimento do OneDrip:

- **Oliveira Imports** - Cliente pioneiro e feedback valioso
- **Comunidade de Desenvolvedores** - Sugestões e melhorias
- **Beta Testers** - Testes e validações do sistema

---

*"Seus clientes merecem o melhor. O OneDrip entrega excelência."*

**© 2025 OneDrip - Desenvolvido por KukySolutions™**

</div>
