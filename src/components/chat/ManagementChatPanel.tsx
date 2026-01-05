import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, Send, Trash2, X, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useManagementChat, ChatMessage } from '@/hooks/useManagementChat';
import { cn } from '@/lib/utils';

interface ProjectSummary {
  id: string;
  name: string;
  health: string | null;
  progress: number;
  nextMilestone?: string;
  pendingTasks?: number;
}

interface ManagementChatProps {
  contextType: 'management' | 'execution';
  // For management context
  projectsSummary?: {
    total: number;
    healthy: number;
    attention: number;
    critical: number;
    noStatus: number;
  };
  projects?: ProjectSummary[];
  // For execution context
  projectDetails?: {
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

export function ManagementChatPanel({
  contextType,
  projectsSummary,
  projects,
  projectDetails,
}: ManagementChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const context = useMemo(() => {
    if (contextType === 'management') {
      return {
        type: 'management' as const,
        summary: projectsSummary || { total: 0, healthy: 0, attention: 0, critical: 0, noStatus: 0 },
        projects: projects || [],
      };
    }
    return {
      type: 'execution' as const,
      project: projectDetails || {
        name: '',
        milestones: [],
        indicators: [],
        tasks: [],
        pendingActions: 0,
        completedActions: 0,
      },
    };
  }, [contextType, projectsSummary, projects, projectDetails]);

  const { messages, isLoading, sendMessage, clearChat } = useManagementChat(context);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholderText = contextType === 'management'
    ? 'Ex: Quais projetos precisam de atenção?'
    : 'Ex: Quais milestones estão atrasados?';

  const welcomeMessage = contextType === 'management'
    ? 'Olá! 👋 Posso te ajudar a entender o status dos seus projetos. Pergunte sobre projetos em risco, tarefas pendentes ou prioridades.'
    : 'Olá! 👋 Posso te ajudar com este projeto. Pergunte sobre milestones, indicadores, tarefas ou próximos passos.';

  return (
    <>
      {/* Floating button */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </DrawerTrigger>

        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <DrawerTitle>
                  {contextType === 'management' ? 'Assistente de Gestão' : 'Assistente do Projeto'}
                </DrawerTitle>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex flex-col h-full">
            {/* Messages area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 bg-muted rounded-lg p-3">
                      <p className="text-sm">{welcomeMessage}</p>
                    </div>
                  </div>
                )}

                {/* Chat messages */}
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))}

                {/* Loading indicator */}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary' : 'bg-primary/10'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>
      <div
        className={cn(
          'flex-1 rounded-lg p-3 max-w-[80%]',
          isUser ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
