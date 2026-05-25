import api from '@/services/core/api';
import type { QuickReply, QuickRepliesResponse, QuickReplyFormData } from '@/types/knowledge';

class QuickRepliesService {
  private get baseUrl(): string {
    return '/quick_replies';
  }

  async getQuickReplies(search?: string): Promise<QuickRepliesResponse> {
    const params = search ? { search } : {};
    const response = await api.get(this.baseUrl, { params });
    return response.data as QuickRepliesResponse;
  }

  async createQuickReply(data: QuickReplyFormData): Promise<QuickReply> {
    const response = await api.post(this.baseUrl, { quick_reply: data });
    return (response.data as { data: QuickReply }).data;
  }

  async updateQuickReply(id: string, data: Partial<QuickReplyFormData>): Promise<QuickReply> {
    const response = await api.patch(`${this.baseUrl}/${id}`, { quick_reply: data });
    return (response.data as { data: QuickReply }).data;
  }

  async deleteQuickReply(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async renderPreview(id: string, leadId?: string, brokerId?: string): Promise<string> {
    const response = await api.post(`${this.baseUrl}/${id}/render_preview`, {
      lead_id: leadId,
      broker_id: brokerId,
    });
    return (response.data as { data: { rendered: string } }).data.rendered;
  }
}

export const quickRepliesService = new QuickRepliesService();
