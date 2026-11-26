import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X, ArrowRight, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { useReservationDraft } from '../context/ReservationContext';
import { useRouter } from '../lib/router';
import {
  buildFixedWhatsAppUrl,
  buildWhatsAppRequestMessage,
  formatFullDate,
  formatTimeDisplay,
  validatePhoneNumber,
} from '../lib/karachiTime';
import { RESTAURANT } from '../data/restaurant';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const QUICK_ACTIONS = [
  { label: 'Plan a dinner', prompt: 'I would like to plan a dinner reservation at Andaaz.' },
  { label: 'Explore the menu', prompt: 'What dishes are in your verified menu highlights?' },
  { label: 'Private occasion', prompt: 'Tell me about private events and corporate hosting.' },
  { label: 'Find us', prompt: 'Where is Andaaz Restaurant located and how can I reach the team?' },
];

export function AskAndaaz() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Assalam-o-Alaikum. I'm Andaaz's AI dining assistant. I can help you explore the verified menu or prepare a table request. What would you like to plan?",
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const [healthChecked, setHealthChecked] = useState(false);
  const [whatsappOpenedInChat, setWhatsappOpenedInChat] = useState(false);
  const [copiedInChat, setCopiedInChat] = useState(false);

  const { draft, updateDraft } = useReservationDraft();
  const { navigate } = useRouter();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open || healthChecked) return;
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (!data?.geminiConfigured) {
          setUnavailableReason(
            'The live AI dining assistant is currently unavailable because Gemini credentials are not configured in this environment.'
          );
        }
        setHealthChecked(true);
      })
      .catch(() => {
        setHealthChecked(true);
      });
  }, [open, healthChecked]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const assistantMsgId = `m-${Date.now() + 1}`;
    const nextHistory = [...messages.filter((m) => m.id !== 'welcome'), userMsg].map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg, { id: assistantMsgId, role: 'model', text: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory,
          currentDraft: draft,
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => null);
        const errMsg =
          errPayload?.message ||
          'The AI dining assistant is temporarily unavailable. You can use the reservation form or contact the restaurant directly.';
        if (response.status === 503) {
          setUnavailableReason(errMsg);
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, text: errMsg } : m))
        );
        setStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response stream unavailable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const evt = JSON.parse(jsonStr);
            if (evt.type === 'delta' && typeof evt.text === 'string') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, text: m.text + evt.text } : m
                )
              );
            } else if (evt.type === 'draftUpdate' && evt.patch) {
              updateDraft(evt.patch);
            } else if (evt.type === 'error' && evt.message) {
              if (evt.code === 503 || evt.code === 403 || evt.code === 400 || evt.code === 404) {
                setUnavailableReason(evt.message);
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, text: m.text ? `${m.text}\n\n${evt.message}` : evt.message }
                    : m
                )
              );
            }
          } catch {
            // Ignore partial JSON lines
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: 'Unable to reach the assistant right now. Please use the reservation form or reach Andaaz directly on WhatsApp (+92 300 0263229).',
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const draftReadyForWhatsApp =
    Boolean(draft.name.trim()) &&
    validatePhoneNumber(draft.phone) === null &&
    Boolean(draft.date) &&
    Boolean(draft.time) &&
    draft.guests >= 1;

  const hasAnyDraftDetails =
    Boolean(draft.name.trim()) ||
    Boolean(draft.phone.trim()) ||
    Boolean(draft.notes.trim()) ||
    draft.occasionType !== '';

  const whatsappUrl = draftReadyForWhatsApp
    ? buildFixedWhatsAppUrl(buildWhatsAppRequestMessage(draft))
    : null;

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-label="Open Ask Andaaz dining assistant"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2.5 rounded-2xl bg-[#172332] hover:bg-[#1F2B38] text-[#FAF8F3] px-4 py-3 text-sm font-medium shadow-lg border border-[#AA7C7E]/30 transition-transform hover:-translate-y-0.5 min-h-[44px]"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <MessageSquare className="h-4 w-4 text-[#AA7C7E]" />
          <span className="whitespace-nowrap">Ask Andaaz</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ask Andaaz AI Dining Assistant"
          className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] sm:max-w-[calc(100vw-2rem)] h-[min(82dvh,640px)] max-h-[calc(100dvh-0.75rem)] sm:h-[600px] sm:max-h-[82dvh] bg-[#FAF8F3] text-[#172332] sm:rounded-2xl rounded-t-2xl shadow-2xl border border-[#172332]/15 flex flex-col overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Header */}
          <div className="bg-[#172332] text-[#FAF8F3] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="font-serif text-xl font-medium leading-tight">Ask Andaaz</h2>
              <p className="text-xs text-[#FAF8F3]/75">
                AI dining assistant · Requests require team confirmation
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="Close Ask Andaaz"
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl hover:bg-[#FAF8F3]/10 text-[#FAF8F3] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Unavailable Banner if API key missing or 503 */}
          {unavailableReason && (
            <div className="bg-[#7E4D54]/10 border-b border-[#7E4D54]/20 px-4 py-3 text-xs text-[#172332] flex items-start gap-2.5 shrink-0">
              <AlertCircle className="h-4 w-4 text-[#7E4D54] shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p>{unavailableReason}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate('/reservations');
                    }}
                    className="font-medium text-[#7E4D54] underline underline-offset-2"
                  >
                    Open Reservation Form
                  </button>
                  <a
                    href={`tel:${RESTAURANT.phoneE164}`}
                    className="font-medium text-[#172332] underline underline-offset-2"
                  >
                    Call {RESTAURANT.phoneDisplay}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#7E4D54] text-[#FAF8F3]'
                      : 'bg-[#F2EDE3] text-[#172332] border border-[#172332]/10'
                  }`}
                >
                  {msg.text || (streaming && msg.role === 'model' ? 'Thinking…' : '')}
                </div>
              </div>
            ))}

            {/* Quick actions on fresh conversation */}
            {messages.length <= 1 && !unavailableReason && (
              <div className="pt-2 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => sendMessage(qa.prompt)}
                    className="rounded-xl border border-[#172332]/15 bg-[#FAF8F3] hover:bg-[#F2EDE3] px-3 py-2 text-xs font-medium text-[#172332] transition-colors"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            )}

            {/* Shared Draft Preview inside Assistant */}
            {hasAnyDraftDetails && (
              <div className="rounded-xl border border-[#172332]/15 bg-white/80 p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[#172332]">Prepared Request Draft</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate('/reservations');
                    }}
                    className="inline-flex items-center gap-1 font-medium text-[#7E4D54] hover:underline"
                  >
                    Review in Form <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-[#4F5D6A] space-y-0.5 tabular-nums">
                  <p>
                    {formatFullDate(draft.date)} · {formatTimeDisplay(draft.time)} · {draft.guests}{' '}
                    {draft.guests === 1 ? 'guest' : 'guests'}
                  </p>
                  {draft.name && <p>Guest: {draft.name}</p>}
                  {draft.seating !== 'no-preference' && (
                    <p>Seating preference: {draft.seating} (subject to confirmation)</p>
                  )}
                </div>
                {whatsappUrl && (
                  <div className="pt-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setWhatsappOpenedInChat(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-3 py-2 font-medium transition-colors"
                      >
                        Continue on WhatsApp <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(buildWhatsAppRequestMessage(draft));
                            setCopiedInChat(true);
                            setTimeout(() => setCopiedInChat(false), 3000);
                          } catch {
                            // Ignore clipboard restriction
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#172332]/20 px-3 py-2 text-[#172332] hover:bg-[#F2EDE3]"
                      >
                        {copiedInChat ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedInChat ? 'Copied' : 'Copy request'}
                      </button>
                      <a
                        href={RESTAURANT.officialReservationPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#172332]/20 px-3 py-2 text-[#172332] hover:bg-[#F2EDE3]"
                      >
                        Official Form
                      </a>
                    </div>
                    {whatsappOpenedInChat && (
                      <p role="status" className="text-[11px] text-[#172332] bg-[#F2EDE3] rounded-lg px-2.5 py-2">
                        Continue in WhatsApp to send your request. Your reservation is subject to confirmation from the restaurant.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 border-t border-[#172332]/10 bg-[#FAF8F3] flex items-center gap-2 shrink-0"
          >
            <label htmlFor="ask-andaaz-input" className="sr-only">
              Ask Andaaz a question
            </label>
            <input
              id="ask-andaaz-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming || Boolean(unavailableReason)}
              placeholder={
                unavailableReason
                  ? 'Assistant unavailable — use Reservation Form'
                  : 'Ask about dinner, menu, or an occasion…'
              }
              maxLength={800}
              className="flex-1 rounded-xl border border-[#172332]/20 bg-white px-3.5 py-2.5 text-sm text-[#172332] placeholder:text-[#4F5D6A]/70 focus:outline-none focus:border-[#7E4D54] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming || Boolean(unavailableReason)}
              aria-label="Send message"
              className="h-11 w-11 inline-flex items-center justify-center rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] disabled:opacity-45 transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
