import api from '@/services/core/api';

export interface AutomationTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  position: number;
  meta: {
    icon: string;
    color: string;
    tags: string[];
  };
  template_data?: {
    rules: unknown[];
    followup_sequences: unknown[];
    tags_to_create: unknown[];
  };
}

export interface ApplyTemplateResult {
  applied: {
    rules: string[];
    sequences: string[];
    tags: string[];
  };
}

const BASE = '/automation_templates';

export const automationTemplatesService = {
  async getAll(category?: string): Promise<AutomationTemplate[]> {
    const params = category ? { category } : {};
    const res = await api.get(BASE, { params });
    return (res.data as { data: AutomationTemplate[] }).data ?? [];
  },

  async get(id: string): Promise<AutomationTemplate> {
    const res = await api.get(`${BASE}/${id}`);
    return (res.data as { data: AutomationTemplate }).data;
  },

  async apply(id: string, inboxId: string): Promise<ApplyTemplateResult> {
    const res = await api.post(`${BASE}/${id}/apply`, { inbox_id: inboxId });
    return (res.data as { data: ApplyTemplateResult }).data;
  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  recepcao: 'Recepção',
  followup:  'Follow-up',
  funil:     'Funil de Vendas',
  roleta:    'Roleta',
  relatorio: 'Relatórios',
  chatbot:   'Chatbot',
  pos_venda: 'Pós-venda',
};
