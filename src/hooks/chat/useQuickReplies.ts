import { useState, useEffect, useCallback } from 'react';
import { quickRepliesService } from '@/services/quickReplies/quickRepliesService';
import type { QuickReply } from '@/types/knowledge';

interface UseQuickRepliesReturn {
  quickReplies: QuickReply[];
  isLoading: boolean;
  searchQuickReplies: (query: string) => QuickReply[];
  reload: () => Promise<void>;
}

export const useQuickReplies = (): UseQuickRepliesReturn => {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await quickRepliesService.getQuickReplies();
      setQuickReplies(response.data ?? []);
    } catch (err) {
      console.error('Error loading quick replies:', err);
      setQuickReplies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const searchQuickReplies = useCallback(
    (query: string): QuickReply[] => {
      if (!query.trim()) return quickReplies;
      const q = query.toLowerCase();
      return quickReplies.filter(
        r => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q),
      );
    },
    [quickReplies],
  );

  return { quickReplies, isLoading, searchQuickReplies, reload: load };
};
