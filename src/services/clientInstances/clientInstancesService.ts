import apiClient from '@/services/core/api';

export type InstanceStatus = 'pending' | 'provisioning_railway' | 'active' | 'error';

export interface ClientInstance {
  id: number;
  name: string;
  slug: string;
  admin_email: string;
  admin_name: string | null;
  status: InstanceStatus;
  backend_url: string | null;
  frontend_link: string | null;
  error_message: string | null;
  provisioning_log: { time: string; message: string }[];
  created_at: string;
}

export interface CreateClientInstancePayload {
  name: string;
  admin_email: string;
  admin_name?: string;
}

const clientInstancesService = {
  list: () =>
    apiClient.get<{ data: ClientInstance[] }>('/client_instances'),

  get: (id: number) =>
    apiClient.get<{ data: ClientInstance }>(`/client_instances/${id}`),

  create: (payload: CreateClientInstancePayload) =>
    apiClient.post<{ data: ClientInstance }>('/client_instances', {
      client_instance: payload,
    }),

  delete: (id: number) =>
    apiClient.delete(`/client_instances/${id}`),
};

export default clientInstancesService;
