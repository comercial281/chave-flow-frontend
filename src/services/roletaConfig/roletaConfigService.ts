import api from '@/services/core/api';

export interface RoletaMember {
  id?: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  weight: number;
  is_active: boolean;
  position: number;
  personal_whatsapp_number: string;
}

export interface RoletaConfig {
  id: string;
  inbox_id: string;
  is_active: boolean;
  timeout_minutes: number;
  gestor_whatsapp_number: string;
  notification_inbox_id: string | null;
  business_hours_config: Record<string, unknown>;
  members: RoletaMember[];
  created_at: string;
  updated_at: string;
}

export interface RoletaConfigPayload {
  inbox_id: string;
  is_active: boolean;
  timeout_minutes: number;
  gestor_whatsapp_number: string;
  notification_inbox_id?: string | null;
  members: Omit<RoletaMember, 'id' | 'user_name' | 'user_avatar'>[];
}

export interface BrokerAssignment {
  id: string;
  contact_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  assigned_user: { id: string; name: string | null };
  status: 'pending' | 'accepted' | 'passed' | 'expired';
  assigned_at: string;
  accepted_at: string | null;
  passed_at: string | null;
  timeout_minutes: number;
  round: number;
}

const BASE = '/roleta_configs';

export const roletaConfigService = {
  async getAll(): Promise<RoletaConfig[]> {
    const res = await api.get(BASE);
    return (res.data as { data: RoletaConfig[] }).data ?? [];
  },

  async getForInbox(inboxId: string): Promise<RoletaConfig | null> {
    try {
      const res = await api.get(`${BASE}/for_inbox/${inboxId}`);
      return (res.data as { data: RoletaConfig }).data;
    } catch {
      return null;
    }
  },

  async create(payload: RoletaConfigPayload): Promise<RoletaConfig> {
    const res = await api.post(BASE, payload);
    return (res.data as { data: RoletaConfig }).data;
  },

  async update(id: string, payload: Partial<RoletaConfigPayload>): Promise<RoletaConfig> {
    const res = await api.patch(`${BASE}/${id}`, payload);
    return (res.data as { data: RoletaConfig }).data;
  },

  async destroy(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },

  async getAssignments(status?: string): Promise<BrokerAssignment[]> {
    const params = status ? { status } : {};
    const res = await api.get(`${BASE}/assignments`, { params });
    return (res.data as { data: BrokerAssignment[] }).data ?? [];
  },
};
