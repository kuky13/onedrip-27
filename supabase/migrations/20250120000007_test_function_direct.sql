-- Testar a função get_user_notifications diretamente
DO $$
DECLARE
    test_user_id UUID;
    result_count INTEGER;
    rec RECORD;
BEGIN
    -- Pegar o primeiro usuário disponível
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testando com usuário: %', test_user_id;
        
        -- Testar a função get_user_notifications (ela usa auth.uid() internamente)
        -- Primeiro vamos simular uma autenticação
        PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
        
        SELECT COUNT(*) INTO result_count 
        FROM get_user_notifications(50, 0);
        
        RAISE NOTICE 'Função get_user_notifications retornou % registros', result_count;
        
        -- Mostrar os primeiros 3 resultados
        FOR rec IN 
            SELECT * FROM get_user_notifications(3, 0)
        LOOP
            RAISE NOTICE 'Notificação: ID=%, Título=%, Tipo=%, Lida=%, Deletada=%', 
                rec.id, rec.title, rec.type, rec.is_read, rec.user_deleted_at;
        END LOOP;
        
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado!';
    END IF;
END $$;