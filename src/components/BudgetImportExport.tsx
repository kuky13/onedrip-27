import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBudgetImportExport } from '@/hooks/useBudgetImportExport';

export const BudgetImportExport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    exportBudgets,
    parseImportFile,
    confirmImport,
    cancelImport,
    clearImportResults,
    isExporting,
    isImporting,
    importResults,
    importPreview,
    showPreview
  } = useBudgetImportExport();

  const handleExport = async () => {
    await exportBudgets();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await parseImportFile(file);
    
    // Limpar o input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    await confirmImport();
  };

  const handleCancelImport = () => {
    cancelImport();
  };

  return (
    <div className="space-y-6">
      {/* Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Orçamentos
          </CardTitle>
          <CardDescription>
            Baixe todos os seus orçamentos em formato CSV para backup ou análise externa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>Exportando...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Orçamentos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Importação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Orçamentos
          </CardTitle>
          <CardDescription>
            Importe orçamentos de um arquivo CSV. O arquivo deve seguir o formato específico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-file">Selecionar arquivo CSV</Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={isImporting}
            />
          </div>

          {isImporting && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Processando arquivo... Aguarde.
              </AlertDescription>
            </Alert>
          )}

          {importResults && (
            <Alert className={importResults.errors.length > 0 ? "border-yellow-500" : "border-green-500"}>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Importação concluída:</strong></p>
                  <p>✅ {importResults.success} orçamentos importados com sucesso</p>
                  {importResults.errors.length > 0 && (
                    <div>
                      <p>❌ {importResults.errors.length} erros encontrados:</p>
                      <ul className="list-disc list-inside text-sm mt-1 max-h-32 overflow-y-auto">
                        {importResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearImportResults}
                    className="mt-2"
                  >
                    Fechar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Formato do arquivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formato do Arquivo
          </CardTitle>
          <CardDescription>
            Estrutura necessária para o arquivo CSV de importação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O arquivo CSV deve conter as seguintes colunas na ordem exata (separadas por ponto e vírgula):
            </p>
            <div className="bg-muted p-3 rounded-md text-sm font-mono">
              <div>1. Tipo Aparelho (obrigatório)</div>
              <div>2. Serviço/Aparelho (obrigatório)</div>
              <div>3. Qualidade (opcional)</div>
              <div>4. Observações (opcional)</div>
              <div>5. Preço à Vista (obrigatório)</div>
              <div>6. Preço Parcelado (obrigatório)</div>
              <div>7. Parcelas (obrigatório)</div>
              <div>8. Método de Pagamento</div>
              <div>9. Garantia (meses)</div>
              <div>10. Validade (dias)</div>
              <div>11. Inclui Entrega (sim/não)</div>
              <div>12. Inclui Película (sim/não)</div>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Exemplo:</strong><br />
              celular;Tela iPhone 11;Gold;Com mensagem de peça não genuína;750;800;10;Cartão de Crédito;6;15;sim;sim
            </p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Dica:</strong> Os campos "Qualidade" e "Observações" são opcionais e podem ficar vazios, 
                mas as colunas devem estar presentes no arquivo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};