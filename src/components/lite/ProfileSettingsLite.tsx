import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { User, Save } from 'lucide-react';
interface ProfileSettingsLiteProps {
  userId: string;
  profile: any;
}
export const ProfileSettingsLite = ({
  userId,
  profile
}: ProfileSettingsLiteProps) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || ''
      });
    }
  }, [profile]);
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('O nome é obrigatório.');
      return;
    }
    try {
      setLoading(true);
      const {
        error
      } = await supabase.from('user_profiles').update({
        name: formData.name
      }).eq('id', userId);
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao salvar informações');
    } finally {
      setLoading(false);
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <User className="h-5 w-5 mr-2 text-primary" />
          Perfil Pessoal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" type="text" value={formData.name} onChange={e => setFormData({
          ...formData,
          name: e.target.value
        })} placeholder="Seu nome completo" className="w-full" />
        </div>

        

        <Button onClick={handleSave} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
          {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {loading ? 'Salvando...' : success ? 'Salvo!' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>;
};