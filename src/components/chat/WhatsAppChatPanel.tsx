import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, MessageCircle, Send, Trash2 } from 'lucide-react';
import { chatApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatIST } from '../../utils/format';

interface WhatsAppChatPanelProps {
  mode: 'customer' | 'owner';
  initialConversationId?: string | null;
}

export function WhatsAppChatPanel({ mode, initialConversationId = null }: WhatsAppChatPanelProps) {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const effectiveMode = user?.role === 'PROPERTY_OWNER' ? 'owner' : mode;

  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);
  const [draft, setDraft] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const convQuery = useQuery({
    queryKey: ['chat-conversations', effectiveMode],
    queryFn: chatApi.listConversations,
    refetchInterval: 5000,
  });

  const conversations = convQuery.data ?? [];

  useEffect(() => {
    if (initialConversationId) {
      setSelectedId(initialConversationId);
    } else if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [initialConversationId, conversations, selectedId]);

  const activeConv = conversations.find((c) => c.id === selectedId) ?? null;

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', selectedId],
    queryFn: () => chatApi.getMessages(selectedId!),
    enabled: Boolean(selectedId),
    refetchInterval: 4000,
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, selectedId]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => chatApi.sendMessage(selectedId!, text),
    onSuccess: () => {
      setDraft('');
      void qc.invalidateQueries({ queryKey: ['chat-messages', selectedId] });
      void qc.invalidateQueries({ queryKey: ['chat-conversations', effectiveMode] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-messages', selectedId] });
      void qc.invalidateQueries({ queryKey: ['chat-conversations', effectiveMode] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    sendMutation.mutate(draft.trim());
  };

  return (
    <div className="glass-panel grid h-[640px] overflow-hidden rounded-2xl border border-slate-800 lg:grid-cols-12">
      {/* Left Sidebar: Conversations */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-950/70 lg:col-span-4 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            {effectiveMode === 'owner' ? 'Customer Chats' : 'Hostel Inquiries & Chats'}
          </h2>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            {conversations.length}
          </span>
        </div>

        <div className="flex-1 divide-y divide-slate-800/70 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {effectiveMode === 'owner'
                ? 'No customer messages yet. When a student messages your hostel, it appears here.'
                : 'No chats yet. Click "Chat with Owner" on any hostel page to start.'}
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = c.id === selectedId;
              const title = effectiveMode === 'owner' ? c.customerName : c.propertyName;
              const roomTag =
                c.roomNumber != null
                  ? `Room ${c.roomNumber}${c.bedNumber ? ` (${c.bedNumber})` : ''}`
                  : 'Inquiry';

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full items-start justify-between gap-2 px-4 py-3 text-left transition ${
                    isSelected ? 'bg-emerald-500/15' : 'hover:bg-slate-900/70'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{title}</span>
                      {effectiveMode === 'owner' && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            c.roomNumber
                              ? 'bg-cyan-500/20 text-cyan-200'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {roomTag}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-cyan-300/90">
                      {effectiveMode === 'owner' ? c.propertyName : `Owner: ${c.ownerName}`}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {c.lastMessage ?? 'Start the conversation…'}
                    </p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="mt-1 shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: WhatsApp-style Thread */}
      <div className="flex flex-col bg-[#0b141a]/80 lg:col-span-8">
        {activeConv ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    {effectiveMode === 'owner' ? activeConv.customerName : activeConv.propertyName}
                  </h3>
                  {activeConv.roomNumber ? (
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200">
                      Room {activeConv.roomNumber}
                      {activeConv.bedNumber ? ` · ${activeConv.bedNumber}` : ''}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-300">
                      Inquiry
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {effectiveMode === 'owner'
                    ? `Property: ${activeConv.propertyName}`
                    : `Owner: ${activeConv.ownerName}`}
                </p>
              </div>
              <span className="text-[11px] text-emerald-300">Private &amp; Isolated Chat</span>
            </div>

            <div ref={messagesContainerRef} className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="mx-auto my-8 max-w-xs rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center text-xs text-slate-400">
                  Messages here are private between you and the {effectiveMode === 'owner' ? 'guest' : 'hostel owner'}.
                </div>
              )}
              {messages.map((m) => {
                const isMine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`group max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow ${
                        isMine
                          ? 'rounded-br-sm bg-emerald-700/90 text-white'
                          : 'rounded-bl-sm border border-slate-700 bg-slate-800/95 text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-200/75">
                        <span>{formatIST(m.createdAt)}</span>
                        {isMine &&
                          (m.readByRecipient ? (
                            <CheckCheck className="h-3 w-3 text-cyan-300" />
                          ) : (
                            <Check className="h-3 w-3" />
                          ))}
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(m.id)}
                            title="Delete message"
                            aria-label="Delete message"
                            className="ml-1 text-rose-200/80 opacity-80 transition hover:text-rose-200 hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/90 p-3">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={sendMutation.isPending || !draft.trim()}
                aria-label="Send message"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-sm text-slate-400">
            <MessageCircle className="mb-2 h-10 w-10 text-emerald-400/50" />
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
