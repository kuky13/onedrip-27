export interface Budget {
  id: string;
  client_name: string;
  device_model: string;
  device_type: string;
  issue: string;
  description?: string;
  part_type: string;
  cash_price: number;
  warranty_months: number;
  includes_delivery: boolean;
  includes_screen_protector: boolean;
  total: number;
  status: string;
  valid_until: string;
  created_at: string;
  deleted_at?: string | null;
  owner_id: string;
}

export interface BudgetAction {
  action: () => void;
  title: string;
  description: string;
}

export interface BudgetSelectionStats {
  selectedCount: number;
  hasSelection: boolean;
  isAllSelected: boolean;
}