import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

export const useLicenseNotifications = () => {
  const { profile } = useAuth();
  const { showWarning, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // License notifications now handled by license system only
    return;
  }, [profile, showWarning, showError, navigate]);
};