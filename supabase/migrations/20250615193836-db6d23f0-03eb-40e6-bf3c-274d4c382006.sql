
-- Cria a tabela para armazenar credenciais temporariamente após o pagamento bem-sucedido.
CREATE TABLE public.temporary_credentials (
  payment_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retrieved_at TIMESTAMPTZ
);

-- Habilita a segurança de nível de linha (RLS) para proteger os dados.
ALTER TABLE public.temporary_credentials ENABLE ROW LEVEL SECURITY;

-- Por padrão, nenhuma política de acesso é criada, 
-- então o acesso só será possível através de Funções de Borda (Edge Functions) com chaves de administrador,
-- garantindo que as senhas não fiquem expostas.

