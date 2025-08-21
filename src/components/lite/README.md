# Componentes Lite - Versão Mobile Otimizada

Componentes otimizados para dispositivos móveis com funcionalidades avançadas de importação/exportação adaptadas para touch e telas pequenas.

## 🚀 Funcionalidades Principais

### ✅ **Sistema Avançado Mobile**
- 📱 **Interface Touch-Friendly** - Botões grandes e gestos otimizados
- 🎯 **Detecção Automática** de formato com feedback visual
- 📊 **Preview Simplificado** - Dados essenciais para telas pequenas
- ⚡ **Performance Otimizada** - Processamento limitado para mobile
- 🔄 **Feedback Tátil** - Vibração e animações suaves
- 📈 **Estatísticas Visuais** - Cards com métricas importantes

### ✅ **Formatos Suportados**
- **CSV** - Comma Separated Values
- **Excel** - .xlsx e .xls (limitado a 10MB)
- **JSON** - JavaScript Object Notation
- **XML** - eXtensible Markup Language
- **TSV** - Tab Separated Values

## 📦 Componentes

### `AdvancedDataManagementLite`
Hub principal otimizado para mobile com tabs e interface simplificada.

```tsx
import { AdvancedDataManagementLite } from '@/components/lite';

<AdvancedDataManagementLite
  userId="user-123"
  onBack={() => navigate('back')}
/>
```

**Funcionalidades:**
- 📊 **Dashboard com estatísticas** em cards compactos
- 📂 **Tabs organizadas** (Importar/Exportar/Lixeira)
- 🎯 **Importação inteligente** com detecção automática
- 📱 **Interface responsiva** otimizada para touch
- 📈 **Histórico de operações** com status visual

### `MobileDragDrop`
Componente de upload otimizado para dispositivos móveis.

```tsx
import { MobileDragDrop } from '@/components/lite';

<MobileDragDrop
  onFileProcessed={(preview) => {
    console.log('Arquivo processado:', preview);
  }}
  onFileRemoved={() => {
    console.log('Arquivo removido');
  }}
  maxFileSize={10 * 1024 * 1024} // 10MB
/>
```

**Características:**
- 🎨 **Interface visual** com ícones grandes
- 📊 **Progress bar** com feedback em tempo real
- 🔍 **Preview inteligente** com dados essenciais
- ⚠️ **Validação instantânea** com mensagens claras
- 📱 **Touch-friendly** com botões grandes

## 🎨 Diferenças da Versão Desktop

### Interface Adaptada
- **Botões maiores** (min-height: 44px) para touch
- **Cards compactos** com informações essenciais
- **Tabs horizontais** ao invés de sidebar
- **Preview limitado** (5-10 registros vs 100+)
- **Feedback tátil** com vibração

### Performance Otimizada
- **Limite de arquivo:** 10MB (vs 50MB desktop)
- **Preview limitado:** 20 registros (vs ilimitado)
- **Processamento em chunks** menores
- **Timeout reduzido** para evitar travamentos
- **Cache otimizado** para mobile

### Funcionalidades Simplificadas
- **Wizard simplificado** em 3 etapas vs 5
- **Validação básica** vs avançada
- **Mapeamento automático** vs manual
- **Histórico limitado** (10 vs ilimitado)

## 📱 Otimizações Mobile

### Touch e Gestos
```tsx
// Botões com tamanho mínimo para touch
className="min-h-[44px] touch-manipulation"

// Scroll otimizado para iOS
className="overflow-y-auto -webkit-overflow-scrolling-touch"

// Feedback tátil
if (window.navigator.vibrate) {
  window.navigator.vibrate(100);
}
```

### Performance
```tsx
// Limite de dados para mobile
const parseResult = await universalParser.parse(file, {
  format: detection.format,
  maxRows: 20 // Limitado para mobile
});

// Preview reduzido
previewData: parseResult.data.slice(0, 5)
```

### Interface Responsiva
```tsx
// Cards em grid responsivo
<div className="grid grid-cols-2 gap-3">

// Tabs otimizadas
<TabsList className="grid w-full grid-cols-3">

// Texto adaptado
<span className="text-xs">Importar</span>
```

## 🔧 Configuração

### Limites Recomendados para Mobile
- **Arquivo máximo:** 10MB
- **Registros por preview:** 5-20
- **Histórico:** 10 operações
- **Timeout:** 15 segundos
- **Chunk size:** 100 registros

### Formatos Otimizados
```tsx
const MOBILE_FORMATS = [
  SupportedFormat.CSV,    // Mais leve
  SupportedFormat.JSON,   // Estruturado
  SupportedFormat.EXCEL   // Limitado a 10MB
];
```

## 📊 Métricas Mobile

### Estatísticas Compactas
```tsx
<div className="grid grid-cols-2 gap-3">
  <Card>
    <CardContent className="py-3">
      <div className="text-center">
        <div className="text-2xl font-bold">{stats.totalBudgets}</div>
        <div className="text-xs text-muted-foreground">Orçamentos</div>
      </div>
    </CardContent>
  </Card>
</div>
```

### Histórico Simplificado
- **Últimas 3 operações** visíveis
- **Status visual** com ícones
- **Informações essenciais** apenas
- **Scroll otimizado** para listas

## 🎯 Casos de Uso

### Importação Rápida Mobile
```tsx
const QuickMobileImport = () => {
  const [filePreview, setFilePreview] = useState(null);

  return (
    <div className="p-4 space-y-4">
      <MobileDragDrop
        onFileProcessed={setFilePreview}
        maxFileSize={5 * 1024 * 1024} // 5MB
      />
      
      {filePreview?.status === 'ready' && (
        <Button 
          className="w-full min-h-[44px]"
          onClick={() => handleImport(filePreview)}
        >
          Importar {filePreview.recordCount} registros
        </Button>
      )}
    </div>
  );
};
```

### Dashboard Mobile
```tsx
const MobileDashboard = () => {
  return (
    <div className="h-[100dvh] flex flex-col">
      {/* Header fixo */}
      <div className="flex items-center p-4 border-b">
        <h1 className="text-xl font-bold">Gestão de Dados</h1>
      </div>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch">
        <AdvancedDataManagementLite userId={userId} />
      </div>
    </div>
  );
};
```

## 🚨 Limitações Mobile

### Arquivos Grandes
- **Máximo 10MB** por arquivo
- **Timeout de 15s** para processamento
- **Preview limitado** a 20 registros
- **Sem processamento em background**

### Funcionalidades Reduzidas
- **Sem mapeamento manual** de campos
- **Validação básica** apenas
- **Sem wizard completo** (3 etapas vs 5)
- **Histórico limitado** a 10 operações

### Compatibilidade
- **iOS Safari:** Totalmente suportado
- **Android Chrome:** Totalmente suportado
- **Outros navegadores:** Funcionalidade básica

## 📚 Migração do Sistema Antigo

### Substituição Direta
```tsx
// Antes
import { DataManagementLite } from '@/components/lite/DataManagementLite';

// Depois
import { AdvancedDataManagementLite } from '@/components/lite';
```

### Novos Props
```tsx
// Props adicionais disponíveis
<AdvancedDataManagementLite
  userId={userId}
  onBack={handleBack}
  // Novos recursos automáticos:
  // - Detecção de formato
  // - Preview interativo
  // - Histórico de operações
  // - Estatísticas visuais
/>
```

O sistema lite mantém toda a funcionalidade essencial do sistema desktop, mas otimizada para a experiência mobile com interface touch-friendly e performance adaptada para dispositivos móveis.