-- Função para limpeza completa de dados de usuários preservando configurações do sistema
CREATE OR REPLACE FUNCTION public.admin_cleanup_all_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_counts jsonb := '{}';
  temp_count integer;
  auth_count integer;
BEGIN
  -- Verificar se é admin antes de executar
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar limpeza completa';
  END IF;

  RAISE NOTICE 'INICIANDO LIMPEZA COMPLETA DE DADOS DE USUÁRIOS...';

  -- 1. LIMPAR DADOS RELACIONADOS AOS ORÇAMENTOS (ordem importante por FK)
  
  -- Limpar partes dos orçamentos
  DELETE FROM public.budget_parts;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budget_parts}', to_jsonb(temp_count));
  RAISE NOTICE 'Budget parts removidas: %', temp_count;
  
  -- Limpar auditoria de exclusão de orçamentos
  DELETE FROM public.budget_deletion_audit;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budget_deletion_audit}', to_jsonb(temp_count));
  RAISE NOTICE 'Audit records removidos: %', temp_count;
  
  -- Limpar orçamentos
  DELETE FROM public.budgets;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budgets}', to_jsonb(temp_count));
  RAISE NOTICE 'Orçamentos removidos: %', temp_count;

  -- 2. LIMPAR DADOS DE ORDENS DE SERVIÇO
  
  -- Limpar anexos das ordens de serviço
  DELETE FROM public.service_order_attachments;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{service_order_attachments}', to_jsonb(temp_count));
  RAISE NOTICE 'Anexos de ordens removidos: %', temp_count;
  
  -- Limpar eventos das ordens de serviço
  DELETE FROM public.service_order_events;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{service_order_events}', to_jsonb(temp_count));
  RAISE NOTICE 'Eventos de ordens removidos: %', temp_count;
  
  -- Limpar itens das ordens de serviço
  DELETE FROM public.service_order_items;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{service_order_items}', to_jsonb(temp_count));
  RAISE NOTICE 'Itens de ordens removidos: %', temp_count;
  
  -- Limpar ordens de serviço
  DELETE FROM public.service_orders;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{service_orders}', to_jsonb(temp_count));
  RAISE NOTICE 'Ordens de serviço removidas: %', temp_count;

  -- 3. LIMPAR DADOS DE CLIENTES (preservar apenas clientes padrão se existirem)
  DELETE FROM public.clients WHERE user_id IS NOT NULL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{clients}', to_jsonb(temp_count));
  RAISE NOTICE 'Clientes de usuários removidos: %', temp_count;

  -- 4. LIMPAR DADOS DE NOTIFICAÇÕES DE USUÁRIOS
  DELETE FROM public.user_notifications_read;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_notifications_read}', to_jsonb(temp_count));
  RAISE NOTICE 'Status de leitura removidos: %', temp_count;
  
  DELETE FROM public.user_notifications;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_notifications}', to_jsonb(temp_count));
  RAISE NOTICE 'Notificações de usuários removidas: %', temp_count;
  
  DELETE FROM public.user_push_subscriptions;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_push_subscriptions}', to_jsonb(temp_count));
  RAISE NOTICE 'Assinaturas push removidas: %', temp_count;

  -- 5. LIMPAR DADOS DE ATIVIDADE E SESSÕES
  DELETE FROM public.user_activity_metrics;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_activity_metrics}', to_jsonb(temp_count));
  RAISE NOTICE 'Métricas de atividade removidas: %', temp_count;
  
  DELETE FROM public.persistent_sessions;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{persistent_sessions}', to_jsonb(temp_count));
  RAISE NOTICE 'Sessões persistentes removidas: %', temp_count;
  
  DELETE FROM public.login_attempts;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{login_attempts}', to_jsonb(temp_count));
  RAISE NOTICE 'Tentativas de login removidas: %', temp_count;
  
  DELETE FROM public.rate_limit_tracking;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{rate_limit_tracking}', to_jsonb(temp_count));
  RAISE NOTICE 'Rate limit tracking removido: %', temp_count;

  -- 6. LIMPAR PERFIS DE LOJA
  DELETE FROM public.shop_profiles;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{shop_profiles}', to_jsonb(temp_count));
  RAISE NOTICE 'Perfis de loja removidos: %', temp_count;

  -- 7. LIMPAR RANKINGS E RESETAR LICENÇAS
  DELETE FROM public.ranking_invaders;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{ranking_invaders}', to_jsonb(temp_count));
  RAISE NOTICE 'Rankings de jogo removidos: %', temp_count;
  
  -- Resetar licenças (remover vínculos com usuários mas manter as licenças)
  UPDATE public.licenses SET user_id = NULL, is_active = FALSE, activated_at = NULL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{licenses_reset}', to_jsonb(temp_count));
  RAISE NOTICE 'Licenças resetadas: %', temp_count;

  -- 8. LIMPAR LOGS ADMINISTRATIVOS (manter logs do sistema, remover apenas de usuários)
  DELETE FROM public.admin_logs WHERE admin_user_id IS NOT NULL OR target_user_id IS NOT NULL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{admin_logs_user_related}', to_jsonb(temp_count));
  RAISE NOTICE 'Logs administrativos de usuários removidos: %', temp_count;

  -- 9. LIMPAR PERFIS DE USUÁRIOS (antes de deletar auth.users)
  DELETE FROM public.user_profiles;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_profiles}', to_jsonb(temp_count));
  RAISE NOTICE 'Perfis de usuários removidos: %', temp_count;

  -- 10. LIMPAR DADOS DE AUTENTICAÇÃO (auth.users e tabelas relacionadas)
  -- ATENÇÃO: Isso remove TODOS os usuários do sistema de autenticação
  
  -- Limpar tabelas de auth relacionadas primeiro
  DELETE FROM auth.identities;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{auth_identities}', to_jsonb(temp_count));
  RAISE NOTICE 'Identidades de auth removidas: %', temp_count;

  DELETE FROM auth.sessions;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{auth_sessions}', to_jsonb(temp_count));
  RAISE NOTICE 'Sessões de auth removidas: %', temp_count;

  DELETE FROM auth.refresh_tokens;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{auth_refresh_tokens}', to_jsonb(temp_count));
  RAISE NOTICE 'Refresh tokens removidos: %', temp_count;

  -- Por último, deletar usuários
  DELETE FROM auth.users;
  GET DIAGNOSTICS auth_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{auth_users}', to_jsonb(auth_count));
  RAISE NOTICE 'Usuários de autenticação removidos: %', auth_count;

  RAISE NOTICE 'LIMPEZA COMPLETA FINALIZADA!';
  RAISE NOTICE 'Total de usuários de autenticação removidos: %', auth_count;
  RAISE NOTICE 'PRESERVADO: device_types, warranty_periods, game_settings, site_settings, notifications globais, license_history';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Limpeza completa de TODOS os dados de usuários executada com sucesso',
    'deleted_counts', deleted_counts,
    'total_auth_users_deleted', auth_count,
    'preserved_tables', jsonb_build_array(
      'device_types', 
      'warranty_periods', 
      'game_settings', 
      'site_settings', 
      'notifications', 
      'license_history',
      'admin_images'
    ),
    'timestamp', now(),
    'warning', 'TODOS os dados de usuários e autenticação foram removidos, configurações do sistema preservadas'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'partial_counts', deleted_counts,
      'warning', 'Erro durante limpeza - alguns dados podem ter sido removidos'
    );
END;
$$;

-- Função para visualizar o que será removido (preview)
CREATE OR REPLACE FUNCTION public.admin_preview_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stats jsonb := '{}';
  auth_users_count integer;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar estatísticas';
  END IF;

  -- Contar usuários de autenticação
  SELECT COUNT(*) INTO auth_users_count FROM auth.users;

  -- Coletar estatísticas de todas as tabelas que serão afetadas
  SELECT jsonb_build_object(
    'auth_users', auth_users_count,
    'user_profiles', (SELECT COUNT(*) FROM public.user_profiles),
    'budgets', (SELECT COUNT(*) FROM public.budgets),
    'budget_parts', (SELECT COUNT(*) FROM public.budget_parts),
    'service_orders', (SELECT COUNT(*) FROM public.service_orders),
    'service_order_items', (SELECT COUNT(*) FROM public.service_order_items),
    'service_order_attachments', (SELECT COUNT(*) FROM public.service_order_attachments),
    'service_order_events', (SELECT COUNT(*) FROM public.service_order_events),
    'clients_with_users', (SELECT COUNT(*) FROM public.clients WHERE user_id IS NOT NULL),
    'licenses_linked', (SELECT COUNT(*) FROM public.licenses WHERE user_id IS NOT NULL),
    'admin_logs_user_related', (SELECT COUNT(*) FROM public.admin_logs WHERE admin_user_id IS NOT NULL OR target_user_id IS NOT NULL),
    'user_activity_metrics', (SELECT COUNT(*) FROM public.user_activity_metrics),
    'shop_profiles', (SELECT COUNT(*) FROM public.shop_profiles),
    'persistent_sessions', (SELECT COUNT(*) FROM public.persistent_sessions),
    'ranking_invaders', (SELECT COUNT(*) FROM public.ranking_invaders),
    'rate_limit_tracking', (SELECT COUNT(*) FROM public.rate_limit_tracking),
    'login_attempts', (SELECT COUNT(*) FROM public.login_attempts),
    'budget_deletion_audit', (SELECT COUNT(*) FROM public.budget_deletion_audit),
    'user_notifications', (SELECT COUNT(*) FROM public.user_notifications),
    'user_notifications_read', (SELECT COUNT(*) FROM public.user_notifications_read),
    'user_push_subscriptions', (SELECT COUNT(*) FROM public.user_push_subscriptions),
    'auth_identities', (SELECT COUNT(*) FROM auth.identities),
    'auth_sessions', (SELECT COUNT(*) FROM auth.sessions),
    'auth_refresh_tokens', (SELECT COUNT(*) FROM auth.refresh_tokens),
    'timestamp', now()
  ) INTO stats;
  
  RETURN jsonb_build_object(
    'total_auth_users', auth_users_count,
    'will_be_deleted', stats,
    'will_be_preserved', jsonb_build_object(
      'device_types', (SELECT COUNT(*) FROM public.device_types),
      'warranty_periods', (SELECT COUNT(*) FROM public.warranty_periods),
      'game_settings', (SELECT COUNT(*) FROM public.game_settings),
      'site_settings', (SELECT COUNT(*) FROM public.site_settings),
      'notifications_global', (SELECT COUNT(*) FROM public.notifications WHERE target_type = 'all'),
      'license_history', (SELECT COUNT(*) FROM public.license_history),
      'admin_images', (SELECT COUNT(*) FROM public.admin_images),
      'clients_without_users', (SELECT COUNT(*) FROM public.clients WHERE user_id IS NULL)
    ),
    'warning', 'ATENÇÃO: Esta operação é IRREVERSÍVEL e remove TODOS os dados de usuários mas preserva configurações do sistema'
  );
END;
$$;