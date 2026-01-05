import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectSummary {
  id: string;
  name: string;
  health: string | null;
  progress: number;
  nextMilestone?: string;
  pendingTasks?: number;
}

interface ManagementContext {
  type: 'management';
  summary: {
    total: number;
    healthy: number;
    attention: number;
    critical: number;
    noStatus: number;
  };
  projects: ProjectSummary[];
}

interface ExecutionContext {
  type: 'execution';
  project: {
    name: string;
    objective?: string;
    health?: string;
    milestones: Array<{
      title: string;
      targetDate: string;
      completed: boolean;
      type?: string;
    }>;
    indicators: Array<{
      name: string;
      current: string;
      target: string;
      unit?: string;
    }>;
    tasks: Array<{
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
    }>;
    pendingActions: number;
    completedActions: number;
  };
}

type ChatContext = ManagementContext | ExecutionContext;

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/management-chat`;

// Generate storage key based on context
function getStorageKey(context: ChatContext): string {
  if (context.type === 'management') {
    return 'chat_history_management';
  }
  return `chat_history_project_${context.project.name.replace(/\s+/g, '_').toLowerCase()}`;
}

// Load messages from localStorage
function loadMessages(key: string): ChatMessage[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
  } catch (e) {
    console.error('Error loading chat history:', e);
  }
  return [];
}

// Save messages to localStorage
function saveMessages(key: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving chat history:', e);
  }
}

export function useManagementChat(context: ChatContext) {
  const storageKey = getStorageKey(context);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey));
  const [isLoading, setIsLoading] = useState(false);

  // Save to localStorage whenever messages change
  useEffect(() => {
    saveMessages(storageKey, messages);
  }, [messages, storageKey]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent, timestamp: new Date() }];
      });
    };

    try {
      const messagesForAPI = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: messagesForAPI, context }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao enviar mensagem');
      }

      if (!response.body) {
        throw new Error('Resposta sem corpo');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar mensagem';
      toast.error(errorMessage);
      
      // Remove the user message if we failed
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  }, [messages, context, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}
