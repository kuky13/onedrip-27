# 📋 Documentação da Página de Planos - OneDrip

## 🎯 Visão Geral

A página de planos do OneDrip é uma landing page moderna e responsiva projetada para converter visitantes em clientes. Ela apresenta os planos de assinatura de forma clara e atrativa, com foco na experiência do usuário e conversão.

## 🎯 COMO EDITAR A PÁGINA

### Para editar TEXTOS e DADOS:
**Arquivo principal:** `src/plans/data/content.ts`

Este arquivo contém TODOS os textos e dados da página. Basta alterar os valores para mudar o conteúdo.

### Principais seções editáveis:

#### 1. **SEÇÃO PRINCIPAL (HERO)**
- `titulo_principal`: "Escolha seu Plano"
- `subtitulo_principal`: Descrição do sistema
- `logo`: Caminho para o logo da empresa

#### 2. **DADOS DOS PLANOS (MENSAL E ANUAL)**
```typescript
planos: {
  mensal: {
    nome: "Plano Profissional",
    preco: 68.90,
    preco_original: 80.00,
    periodo: "/mês",
    beneficios: ["Lista de benefícios..."]
  },
  anual: {
    nome: "Plano Profissional Anual", 
    preco: 638.55,
    economia_texto: "2 meses grátis"
  }
}
```

#### 3. **UPGRADE VIP**
- `nome`: Nome do upgrade
- `preco_adicional`: Valor adicional (R$ 10,00)
- `beneficios`: Funcionalidades avançadas
- **Integração**: Agora integrado diretamente no card do plano para melhor UX

#### 4. **SEÇÕES OPCIONAIS**
Cada seção tem um campo `mostrar_secao` que pode ser `true` ou `false`:
- **Vantagens**: `PLANS_CONTENT.vantagens.mostrar_secao`
- **Depoimentos**: `PLANS_CONTENT.depoimentos.mostrar_secao`  
- **FAQ**: `PLANS_CONTENT.perguntas_frequentes.mostrar_secao`

#### 5. **CONFIGURAÇÕES TÉCNICAS**
- `whatsapp_numero`: "64996028022"
- `url_pagamento`: Removido - agora usa redirecionamento específico por plano

## 💳 Sistema de Pagamento

### 🔄 Fluxo de Compra Atualizado
1. **Seleção do Plano**: Usuário escolhe entre mensal/anual + VIP opcional
2. **Clique no Botão**: Ação de "Assinar Agora"
3. **Redirecionamento Direto**: Usuário é direcionado para o MercadoPago
4. **Links Configurados**: Links específicos por plano no `paymentService.ts`
5. **Confirmação**: Após pagamento, usuário envia comprovante via WhatsApp

### ⚙️ Configuração do Link de Pagamento
O link de pagamento está configurado em:
```typescript
// src/plans/data/content.ts
configuracoes: {
  whatsapp_numero: "64996028022",
  // url_pagamento: Removido - redirecionamento específico por plano
}
```

### 🔧 Implementação Técnica
O redirecionamento é feito através da função:
```typescript
// src/plans/PlansPage.tsx
const aoConfirmarPagamento = () => {
  const urlPagamento = PLANS_CONTENT.configuracoes.url_pagamento;
  window.location.href = urlPagamento;
};
```

## 🎨 Características da Página

### ✨ Design Moderno
- **Glass morphism**: Efeitos de vidro com blur
- **Gradientes animados**: Elementos de fundo com animações suaves
- **Responsividade total**: Funciona perfeitamente em mobile, tablet e desktop
- **Animações fluidas**: Transições e hover effects premium

### 🚀 Funcionalidades
- **Seletor de planos**: Alternância entre mensal e anual
- **Upgrade VIP**: Opção adicional com funcionalidades avançadas
- **Cálculo automático**: Preços e descontos calculados dinamicamente
- **Integração WhatsApp**: Suporte direto via WhatsApp
- **Pagamento MercadoPago**: Redirecionamento seguro para pagamento

## 📁 ESTRUTURA DA PASTA

```
src/plans/
├── README.md                    # Esta documentação completa
├── PlansPage.tsx               # Componente principal da página
├── index.ts                    # Exportações
├── data/
│   └── content.ts              # ⭐ ARQUIVO PARA EDITAR TEXTOS E DADOS
└── components/                 # Componentes reutilizáveis
    ├── PlansHero.tsx           # Seção hero/cabeçalho
    ├── BenefitsSection.tsx     # Seção de vantagens
    ├── PlanCard.tsx            # Card do plano
    ├── PlanSelector.tsx        # Seletor mensal/anual
    ├── VipOption.tsx           # Opção de upgrade VIP
    ├── TestimonialsSection.tsx # Depoimentos
    ├── FAQSection.tsx          # Perguntas frequentes
    └── FinalCTA.tsx            # Call-to-action final
```

## ⚠️ IMPORTANTE

- **SEMPRE EDITE:** Apenas o arquivo `data/content.ts`
- **NUNCA MEXA:** Nos outros arquivos, a menos que seja um desenvolvedor
- **ÍCONES DISPONÍVEIS:** Para a seção de vantagens, use apenas: "Zap", "Shield", "Users", "Award"
- **BACKUP:** Sempre faça uma cópia do arquivo antes de editar

## 🔧 EXEMPLOS DE EDIÇÃO

### Alterar o preço:
```javascript
plano: {
  preco: 59,  // Mude para o valor desejado
  moeda: "R$",
  periodo: "/mês"
}
```

### Adicionar uma vantagem:
```javascript
vantagens: {
  lista: [
    {
      icone: "Zap" as const,
      titulo: "Nova Vantagem",
      descricao: "Descrição da nova vantagem"
    }
    // ... outras vantagens
  ]
}
```

### Ocultar uma seção:
```javascript
depoimentos: {
  mostrar_secao: false,  // Mude para false para ocultar
  // ... resto da configuração
}
```

## 🚀 Melhorias Implementadas

- ✅ **Redirecionamento direto para MercadoPago**: Fluxo simplificado sem WhatsApp intermediário
- ✅ **Link configurável**: URL de pagamento editável no `content.ts`
- ✅ **Documentação completa**: Guia detalhado para edição e manutenção
- ✅ **Fluxo de compra simplificado**: Menos cliques, mais conversões
- ✅ **Interface moderna e responsiva**: Design premium com glass morphism
- ✅ **Integração WhatsApp**: Suporte direto após pagamento
- ✅ **VIP Integrado**: Upgrade VIP agora integrado diretamente no card do plano
- ✅ **Preço VIP Atualizado**: Valor do upgrade VIP alterado para R$ 10,00
- ✅ **UX Melhorada**: Seleção de VIP mais intuitiva e fácil de usar

## 🆘 PRECISA DE AJUDA?

Se tiver dúvidas ou problemas:
1. Verifique se não quebrou a sintaxe do arquivo
2. Certifique-se de que todas as vírgulas e aspas estão corretas
3. Em caso de erro, restaure o backup do arquivo original