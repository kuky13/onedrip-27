// @ts-nocheck - Temporary suppression for type issues
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  User,
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Activity,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe
} from 'lucide-react';
import { useLicenseAnalytics } from '../../hooks/useLicenseAnalytics';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import type {
  EnhancedUserProfileProps,
  EnhancedUser,
  License,
  UserLicenseAnalytics,
  LicenseCreateRequest,
  LicenseUpdateRequest
} from '../../types/userLicense';

interface LicenseFormData {
  type: string;
  expires_at: string;
  max_devices: number;
  features: string[];
  notes?: string;
}

interface UserEditFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  notes?: string;
}

function LicenseCard({ license, onEdit, onDelete, onRenew, onSuspend, onActivate }: {
  license: License;
  onEdit: () => void;
  onDelete: () => void;
  onRenew: () => void;
  onSuspend: () => void;
  onActivate: () => void;
}) {
  const getStatusIcon = () => {
    switch (license.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (license.status) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirada</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspensa</Badge>;
      default:
        return <Badge variant="outline">{license.status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiryDate = new Date(license.expires_at);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  return (
    <Card className={`${isExpiringSoon ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{license.type}</CardTitle>
            {getStatusBadge()}
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Licença</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta licença? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Expira em</p>
            <p className="font-medium">{formatDate(license.expires_at)}</p>
            {isExpiringSoon && (
              <p className="text-xs text-yellow-600">Expira em {daysUntilExpiry} dias</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Dispositivos</p>
            <p className="font-medium">{license.devices_used || 0}/{license.max_devices}</p>
          </div>
        </div>
        
        {license.features && license.features.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Recursos</p>
            <div className="flex flex-wrap gap-1">
              {license.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {license.status === 'active' && (
            <Button variant="outline" size="sm" onClick={onSuspend}>
              Suspender
            </Button>
          )}
          {license.status === 'suspended' && (
            <Button variant="outline" size="sm" onClick={onActivate}>
              Ativar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRenew}>
            Renovar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LicenseForm({ license, onSave, onCancel }: {
  license?: License;
  onSave: (data: LicenseFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<LicenseFormData>({
    type: license?.type || 'basic',
    expires_at: license?.expires_at ? new Date(license.expires_at).toISOString().split('T')[0] : '',
    max_devices: license?.max_devices || 1,
    features: license?.features || [],
    notes: license?.notes || ''
  });

  const availableFeatures = [
    'api_access',
    'advanced_analytics',
    'priority_support',
    'custom_branding',
    'bulk_operations',
    'export_data',
    'integrations'
  ];

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Tipo de Licença</label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Básica</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Data de Expiração</label>
          <Input
            type="date"
            value={formData.expires_at}
            onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Máximo de Dispositivos</label>
        <Input
          type="number"
          min="1"
          value={formData.max_devices}
          onChange={(e) => setFormData(prev => ({ ...prev, max_devices: parseInt(e.target.value) }))}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Recursos</label>
        <div className="grid grid-cols-2 gap-2">
          {availableFeatures.map((feature) => (
            <label key={feature} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.features.includes(feature)}
                onChange={() => handleFeatureToggle(feature)}
                className="rounded"
              />
              <span className="text-sm">{feature.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Observações</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações sobre a licença..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {license ? 'Atualizar' : 'Criar'} Licença
        </Button>
      </div>
    </form>
  );
}

export function EnhancedUserProfile({ userId, onClose }: EnhancedUserProfileProps) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [userFormData, setUserFormData] = useState<UserEditFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    notes: ''
  });

  const { analytics, loading: analyticsLoading } = useLicenseAnalytics({
    filters: { userId },
    realTimeUpdates: true
  });

  const { createBulkOperation } = useBulkOperations();

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - replace with actual API call
      const mockUser: EnhancedUser = {
        id: userId,
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '+55 11 99999-9999',
        company: 'Empresa ABC',
        role: 'admin',
        created_at: '2024-01-15T10:00:00Z',
        last_login: '2024-08-14T15:30:00Z',
        license: {
          id: 'lic_123',
          user_id: userId,
          type: 'premium',
          status: 'active',
          expires_at: '2024-12-31T23:59:59Z',
          max_devices: 5,
          devices_used: 2,
          features: ['api_access', 'advanced_analytics', 'priority_support'],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-08-14T15:30:00Z'
        },
        total_licenses: 1,
        active_licenses: 1,
        expired_licenses: 0
      };
      
      setUser(mockUser);
      setUserFormData({
        name: mockUser.name || '',
        email: mockUser.email,
        phone: mockUser.phone || '',
        company: mockUser.company || '',
        role: mockUser.role || '',
        notes: ''
      });
    } catch (err) {
      setError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (user) {
        setUser({
          ...user,
          name: userFormData.name,
          email: userFormData.email,
          phone: userFormData.phone,
          company: userFormData.company,
          role: userFormData.role
        });
      }
      
      setEditingUser(false);
    } catch (err) {
      setError('Erro ao salvar dados do usuário');
    }
  };

  const handleSaveLicense = async (licenseData: LicenseFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingLicense) {
        // Update existing license
        const updatedLicense: License = {
          ...editingLicense,
          type: licenseData.type,
          expires_at: licenseData.expires_at,
          max_devices: licenseData.max_devices,
          features: licenseData.features,
          notes: licenseData.notes,
          updated_at: new Date().toISOString()
        };
        
        if (user) {
          setUser({ ...user, license: updatedLicense });
        }
      } else {
        // Create new license
        const newLicense: License = {
          id: `lic_${Date.now()}`,
          user_id: userId,
          type: licenseData.type,
          status: 'active',
          expires_at: licenseData.expires_at,
          max_devices: licenseData.max_devices,
          devices_used: 0,
          features: licenseData.features,
          notes: licenseData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        if (user) {
          setUser({ ...user, license: newLicense });
        }
      }
      
      setEditingLicense(null);
      setShowLicenseForm(false);
    } catch (err) {
      setError('Erro ao salvar licença');
    }
  };

  const handleLicenseAction = async (action: string, license: License) => {
    try {
      await createBulkOperation({
        type: action as any,
        user_ids: [userId],
        license_data: action === 'create_license' ? {
          type: license.type,
          expires_at: license.expires_at,
          max_devices: license.max_devices
        } : undefined
      });
      
      // Refresh user data
      await fetchUserData();
    } catch (err) {
      setError(`Erro ao ${action} licença`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Usuário não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Nome não informado'}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Fechar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="licenses">Licenças</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações do Usuário</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(!editingUser)}
                >
                  {editingUser ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  {editingUser ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingUser ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input
                        value={userFormData.name}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <Input
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Empresa</label>
                      <Input
                        value={userFormData.company}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Função</label>
                    <Select value={userFormData.role} onValueChange={(value) => setUserFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEditingUser(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveUser}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Telefone:</span>
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.company && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Empresa:</span>
                        <span>{user.company}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Função:</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Criado em:</span>
                      <span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Último login:</span>
                      <span>{user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* License Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Licenças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{user.total_licenses}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{user.active_licenses}</p>
                  <p className="text-sm text-gray-600">Ativas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{user.expired_licenses}</p>
                  <p className="text-sm text-gray-600">Expiradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Licenças do Usuário</h3>
            <Button onClick={() => setShowLicenseForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Licença
            </Button>
          </div>

          {user.license ? (
            <LicenseCard
              license={user.license}
              onEdit={() => setEditingLicense(user.license)}
              onDelete={() => handleLicenseAction('delete_license', user.license!)}
              onRenew={() => handleLicenseAction('renew_license', user.license!)}
              onSuspend={() => handleLicenseAction('suspend_license', user.license!)}
              onActivate={() => handleLicenseAction('activate_license', user.license!)}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Este usuário não possui licenças</p>
                <Button onClick={() => setShowLicenseForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Licença
                </Button>
              </CardContent>
            </Card>
          )}

          {/* License Form Dialog */}
          <Dialog open={showLicenseForm || !!editingLicense} onOpenChange={(open) => {
            if (!open) {
              setShowLicenseForm(false);
              setEditingLicense(null);
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLicense ? 'Editar Licença' : 'Nova Licença'}
                </DialogTitle>
                <DialogDescription>
                  {editingLicense ? 'Modifique os dados da licença abaixo.' : 'Preencha os dados para criar uma nova licença.'}
                </DialogDescription>
              </DialogHeader>
              <LicenseForm
                license={editingLicense || undefined}
                onSave={handleSaveLicense}
                onCancel={() => {
                  setShowLicenseForm(false);
                  setEditingLicense(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análises de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">Análises detalhadas de uso da licença serão exibidas aqui.</p>
                  {/* Add analytics charts and metrics here */}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">Histórico de atividades do usuário será exibido aqui.</p>
                {/* Add activity timeline here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedUserProfile;