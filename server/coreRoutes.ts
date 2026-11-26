import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, type Content, type FunctionDeclaration } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';

function resolveKitFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), 'public', 'assets', 'aistudio', filename),
    path.resolve(__dirname, '..', 'public', 'assets', 'aistudio', filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }
  }
  throw new Error(`Missing verified kit file: ${filename}`);
}

let cachedPrompt: string | null = null;
let cachedRestaurant: Record<string, unknown> | null = null;
let cachedMenu: Record<string, unknown> | null = null;

function getKitAssets() {
  if (!cachedPrompt) cachedPrompt = resolveKitFile('02-Gemini-System-Prompt_c180f2dc.txt');
  if (!cachedRestaurant) {
    cachedRestaurant = JSON.parse(resolveKitFile('03-Verified-Restaurant-Data_477483f9.json'));
  }
  if (!cachedMenu) {
    cachedMenu = JSON.parse(resolveKitFile('05-Menu-Highlights_21913216.json'));
  }
  return {
    GEMINI_BASE_SYSTEM_PROMPT: cachedPrompt,
    VERIFIED_RESTAURANT_JSON: cachedRestaurant!,
    MENU_HIGHLIGHTS_JSON: cachedMenu!,
  };
}

function getKarachiNow() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
  }).format(now);
  const [hourStr, minuteStr] = timeStr.split(':');
  return {
    dateStr,
    timeStr,
    weekday,
    hour: Number(hourStr),
    minute: Number(minuteStr),
  };
}

const VALID_DINNER_SLOTS = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const DINNER_SLOT_ALIASES: Record<string, string> = {
  '17:00': '17:00',
  '5:00 pm': '17:00',
  '5 pm': '17:00',
  '5pm': '17:00',
  '18:00': '18:00',
  '6:00 pm': '18:00',
  '6 pm': '18:00',
  '6pm': '18:00',
  '19:00': '19:00',
  '7:00 pm': '19:00',
  '7 pm': '19:00',
  '7pm': '19:00',
  '20:00': '20:00',
  '8:00 pm': '20:00',
  '8 pm': '20:00',
  '8pm': '20:00',
  '21:00': '21:00',
  '9:00 pm': '21:00',
  '9 pm': '21:00',
  '9pm': '21:00',
  '22:00': '22:00',
  '10:00 pm': '22:00',
  '10 pm': '22:00',
  '10pm': '22:00',
};

function normalizeDinnerSlot(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return DINNER_SLOT_ALIASES[key] ?? raw.trim();
}

const VALID_OCCASION_SLUGS = [
  'private-brunch',
  'corporate-hosting',
  'dinner-with-music',
  'celebrations',
  'wedding-gatherings',
  'anniversary-dinner',
];

function validateAndSanitizeDraftPatch(rawArgs: Record<string, unknown>, currentDraft: Record<string, unknown>) {
  const karachi = getKarachiNow();
  const patch: Record<string, unknown> = {};
  const rejected: string[] = [];

  const nextMode =
    rawArgs.mode === 'dinner' || rawArgs.mode === 'occasion'
      ? rawArgs.mode
      : currentDraft?.mode === 'occasion'
        ? 'occasion'
        : 'dinner';

  if (rawArgs.mode !== undefined) {
    if (rawArgs.mode === 'dinner' || rawArgs.mode === 'occasion') {
      patch.mode = rawArgs.mode;
    } else {
      rejected.push('mode must be dinner or occasion');
    }
  }

  if (rawArgs.occasionType !== undefined) {
    if (rawArgs.occasionType === '' || VALID_OCCASION_SLUGS.includes(String(rawArgs.occasionType))) {
      patch.occasionType = rawArgs.occasionType;
      if (rawArgs.occasionType !== '') patch.mode = 'occasion';
    } else {
      rejected.push('occasionType must be one of the verified experience types');
    }
  }

  const effectiveOccasion =
    (patch.occasionType as string | undefined) ?? (currentDraft?.occasionType as string | undefined) ?? '';
  const effectiveMode = (patch.mode as string | undefined) ?? nextMode;

  let targetDate = (currentDraft?.date as string | undefined) || karachi.dateStr;
  if (typeof rawArgs.date === 'string') {
    const d = rawArgs.date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      rejected.push('date must be YYYY-MM-DD');
    } else if (d < karachi.dateStr) {
      rejected.push(`date ${d} is in the past (today in Lahore is ${karachi.dateStr})`);
    } else {
      patch.date = d;
      targetDate = d;
    }
  }

  if (typeof rawArgs.time === 'string') {
    const t = rawArgs.time.trim().slice(0, 60);
    const isCustomOccasion =
      effectiveMode === 'occasion' &&
      ['private-brunch', 'corporate-hosting', 'wedding-gatherings'].includes(effectiveOccasion);

    if (!isCustomOccasion) {
      const normalizedSlot = normalizeDinnerSlot(t);
      if (!VALID_DINNER_SLOTS.includes(normalizedSlot)) {
        rejected.push('Ordinary dinner arrival time must be one of 17:00, 18:00, 19:00, 20:00, 21:00, 22:00');
      } else {
        const slotHour = Number(normalizedSlot.split(':')[0]);
        if (targetDate === karachi.dateStr && (karachi.hour > slotHour || (karachi.hour === slotHour && karachi.minute > 0))) {
          rejected.push(`Dinner slot ${normalizedSlot} has already passed today in Lahore (${karachi.timeStr})`);
        } else {
          patch.time = normalizedSlot;
        }
      }
    } else if (t.length > 0) {
      patch.time = t;
    }
  }

  if (rawArgs.guests !== undefined) {
    const g = Number(rawArgs.guests);
    if (!Number.isInteger(g) || g < 1 || g > 500) {
      rejected.push('guests must be a positive integer');
    } else {
      patch.guests = g;
    }
  }

  if (typeof rawArgs.guestCity === 'string') {
    const city = rawArgs.guestCity.trim().slice(0, 80);
    if (city) patch.guestCity = city;
  }

  if (rawArgs.seating !== undefined) {
    if (rawArgs.seating === 'rooftop' || rawArgs.seating === 'indoor' || rawArgs.seating === 'no-preference') {
      patch.seating = rawArgs.seating;
    } else {
      rejected.push('seating must be rooftop, indoor, or no-preference');
    }
  }

  if (typeof rawArgs.name === 'string') {
    const n = rawArgs.name.trim().slice(0, 100);
    if (n) patch.name = n;
  }

  if (typeof rawArgs.phone === 'string') {
    const p = rawArgs.phone.trim().slice(0, 25);
    const digits = p.replace(/\D/g, '');
    if (/^[+\d\s().-]+$/.test(p) && digits.length >= 7 && digits.length <= 15) {
      patch.phone = p;
    } else {
      rejected.push('phone must be a valid international or Pakistani mobile number (7 to 15 digits)');
    }
  }

  if (typeof rawArgs.email === 'string') {
    const em = rawArgs.email.trim().slice(0, 120);
    if (em === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      patch.email = em;
    } else {
      rejected.push('email format is invalid');
    }
  }

  if (typeof rawArgs.notes === 'string') {
    patch.notes = rawArgs.notes.trim().slice(0, 400);
  }

  return { patch, rejected };
}

const getRestaurantInfoTool: FunctionDeclaration = {
  name: 'getRestaurantInfo',
  description:
    'Retrieve verified facts about Andaaz Restaurant (address, landmark, phone/WhatsApp, spaces, corporate capacity, official URLs, and what details are unverified).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
        description: 'Optional topic such as location, contacts, spaces, corporate, or unverified.',
      },
    },
  },
};

const getMenuHighlightsTool: FunctionDeclaration = {
  name: 'getMenuHighlights',
  description:
    'Retrieve verified menu highlights from the official Andaaz HTML menu by optional category or search term.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'Optional category: Tandoor, Karahi, Seafood, Desserts, or Drinks.',
      },
      query: {
        type: Type.STRING,
        description: 'Optional dish keyword to filter highlights.',
      },
    },
  },
};

const updateReservationDraftTool: FunctionDeclaration = {
  name: 'updateReservationDraft',
  description:
    'Validate and update fields in the visitor’s shared reservation draft (never confirms a booking and never changes the WhatsApp recipient).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: { type: Type.STRING, description: 'Either "dinner" or "occasion".' },
      occasionType: {
        type: Type.STRING,
        description:
          'Optional experience slug: private-brunch, corporate-hosting, dinner-with-music, celebrations, wedding-gatherings, anniversary-dinner, or empty string.',
      },
      date: { type: Type.STRING, description: 'Date in YYYY-MM-DD (Asia/Karachi). Must not be in the past.' },
      time: {
        type: Type.STRING,
        description:
          'For ordinary dinner: 17:00, 18:00, 19:00, 20:00, 21:00, or 22:00. For private-brunch / corporate-hosting / wedding-gatherings: a readable daytime or evening session string.',
      },
      guests: { type: Type.INTEGER, description: 'Positive integer guest count.' },
      guestCity: {
        type: Type.STRING,
        description: 'Optional city the guest is enquiring from (all enquiries route to Fort Road, Lahore).',
      },
      seating: { type: Type.STRING, description: 'rooftop, indoor, or no-preference.' },
      name: { type: Type.STRING, description: 'Guest full name.' },
      phone: { type: Type.STRING, description: 'Guest mobile number.' },
      email: { type: Type.STRING, description: 'Optional guest email address.' },
      notes: { type: Type.STRING, description: 'Optional special notes or requests.' },
    },
  },
};

function executeServerTool(
  name: string,
  args: Record<string, unknown>,
  currentDraft: Record<string, unknown>
): { result: Record<string, unknown>; draftPatch?: Record<string, unknown> } {
  const { VERIFIED_RESTAURANT_JSON, MENU_HIGHLIGHTS_JSON } = getKitAssets();
  if (name === 'getRestaurantInfo') {
    return { result: VERIFIED_RESTAURANT_JSON };
  }
  if (name === 'getMenuHighlights') {
    const catFilter = typeof args.category === 'string' ? args.category.trim().toLowerCase() : '';
    const queryFilter = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
    const categories = (MENU_HIGHLIGHTS_JSON.categories as Array<{ name: string; items: string[] }>)
      .filter((c) => !catFilter || c.name.toLowerCase() === catFilter)
      .map((c) => ({
        name: c.name,
        items: queryFilter
          ? c.items.filter((i) => i.toLowerCase().includes(queryFilter))
          : c.items,
      }))
      .filter((c) => c.items.length > 0);
    return {
      result: {
        scope: MENU_HIGHLIGHTS_JSON.scope,
        pricesNote: MENU_HIGHLIGHTS_JSON.prices,
        photosNote: MENU_HIGHLIGHTS_JSON.photos,
        categories,
        officialMenuPdfViewer: VERIFIED_RESTAURANT_JSON.official_menu_pdf_viewer,
      },
    };
  }
  if (name === 'updateReservationDraft') {
    const { patch, rejected } = validateAndSanitizeDraftPatch(args, currentDraft);
    Object.assign(currentDraft, patch);
    return {
      result: {
        accepted: patch,
        rejected,
        currentDraft,
        confirmationRule:
          'This only updates the local request draft. Do not tell the visitor their booking is confirmed.',
      },
      draftPatch: Object.keys(patch).length > 0 ? patch : undefined,
    };
  }
  return { result: { error: 'Unknown tool' } };
}

const rateBuckets = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxRequests = 30;
  const existing = (rateBuckets.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (existing.length >= maxRequests) {
    rateBuckets.set(ip, existing);
    return true;
  }
  existing.push(now);
  rateBuckets.set(ip, existing);
  return false;
}

export function registerCoreApiRoutes(app: Express) {
  app.get('/api/health', (_req, res) => {
    const karachi = getKarachiNow();
    const rawKey = (process.env.GEMINI_API_KEY || '').trim();
    const geminiConfigured = Boolean(rawKey && rawKey !== 'MY_GEMINI_API_KEY');
    res.json({
      ok: true,
      geminiConfigured,
      model: GEMINI_MODEL,
      karachiDate: karachi.dateStr,
      karachiTime: karachi.timeStr,
    });
  });

  app.post('/api/chat', async (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        error: 'rate_limited',
        message: 'Too many requests in a short period. Please wait a moment or use the reservation form directly.',
      });
      return;
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'assistant_unavailable',
        message:
          'The AI dining assistant is currently unavailable. You can still browse the verified menu and prepare a reservation request using the form or official WhatsApp link.',
      });
      return;
    }

    const body = req.body;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 20) {
      res.status(400).json({
        error: 'invalid_request',
        message: 'Please send between 1 and 20 messages.',
      });
      return;
    }

    const contents: Content[] = [];
    for (const m of body.messages) {
      if (
        !m ||
        (m.role !== 'user' && m.role !== 'model') ||
        typeof m.text !== 'string' ||
        m.text.trim().length === 0 ||
        m.text.length > 1000
      ) {
        res.status(400).json({
          error: 'invalid_message',
          message: 'Each message must have a valid role and non-empty text up to 1000 characters.',
        });
        return;
      }
      contents.push({
        role: m.role,
        parts: [{ text: m.text }],
      });
    }

    const workingDraft: Record<string, unknown> =
      body.currentDraft && typeof body.currentDraft === 'object'
        ? { ...body.currentDraft }
        : {};

    const karachi = getKarachiNow();
    const { GEMINI_BASE_SYSTEM_PROMPT, VERIFIED_RESTAURANT_JSON, MENU_HIGHLIGHTS_JSON } = getKitAssets();
    const systemInstruction = [
      GEMINI_BASE_SYSTEM_PROMPT,
      '',
      `RUNTIME CONTEXT (Asia/Karachi): Today is ${karachi.weekday}, ${karachi.dateStr}, and the current local time in Lahore is ${karachi.timeStr}. Resolve relative dates like "today" or "tomorrow" strictly from this date.`,
      '',
      `VERIFIED RESTAURANT DATA:\n${JSON.stringify(VERIFIED_RESTAURANT_JSON)}`,
      '',
      `VERIFIED MENU HIGHLIGHTS:\n${JSON.stringify(MENU_HIGHLIGHTS_JSON)}`,
      '',
      `CURRENT RESERVATION DRAFT STATE:\n${JSON.stringify(workingDraft)}`,
    ].join('\n');

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (payload: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const conversation: Content[] = [...contents];
      const tools = [
        {
          functionDeclarations: [
            getRestaurantInfoTool,
            getMenuHighlightsTool,
            updateReservationDraftTool,
          ],
        },
      ];

      for (let round = 0; round < 4; round++) {
        let stream;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            stream = await ai.models.generateContentStream({
              model: GEMINI_MODEL,
              contents: conversation,
              config: {
                systemInstruction,
                tools,
                abortSignal: controller.signal,
              },
            });
            break;
          } catch (attemptErr: unknown) {
            const attemptStatus = (attemptErr as { status?: number })?.status;
            if (attempt === 0 && attemptStatus === 503) {
              await new Promise((r) => setTimeout(r, 600));
              continue;
            }
            throw attemptErr;
          }
        }
        if (!stream) break;

        const roundParts: Array<Record<string, unknown>> = [];
        const pendingFunctionCalls: Array<{ id?: string; name: string; args: Record<string, unknown> }> = [];

        for await (const chunk of stream) {
          if (chunk.text) {
            sendEvent({ type: 'delta', text: chunk.text });
          }
          const candidateParts = chunk.candidates?.[0]?.content?.parts;
          if (Array.isArray(candidateParts)) {
            for (const part of candidateParts) {
              roundParts.push(part as Record<string, unknown>);
              if (part.functionCall && part.functionCall.name) {
                pendingFunctionCalls.push({
                  id: part.functionCall.id,
                  name: part.functionCall.name,
                  args: (part.functionCall.args as Record<string, unknown>) || {},
                });
              }
            }
          }
        }

        if (pendingFunctionCalls.length === 0) {
          break;
        }

        conversation.push({
          role: 'model',
          parts: roundParts as Content['parts'],
        });

        const functionResponseParts = [];
        for (const call of pendingFunctionCalls) {
          const { result, draftPatch } = executeServerTool(call.name, call.args, workingDraft);
          if (draftPatch) {
            sendEvent({ type: 'draftUpdate', patch: draftPatch });
          }
          functionResponseParts.push({
            functionResponse: {
              id: call.id,
              name: call.name,
              response: result,
            },
          });
        }

        conversation.push({
          role: 'user',
          parts: functionResponseParts,
        });
      }

      sendEvent({ type: 'done' });
    } catch (err: unknown) {
      const errObj = err as { status?: number; message?: string; name?: string };
      const status = errObj?.status;
      const errMsg = String(errObj?.message || '');
      console.error('Gemini API error:', status ?? errObj?.name ?? 'unknown', errMsg.slice(0, 220));
      let userMessage =
        'The AI dining assistant encountered an issue. Please continue with the reservation form or contact +92 300 0263229 directly.';
      if (status === 429) {
        userMessage =
          'The AI dining assistant is temporarily at capacity. Please use the reservation form or WhatsApp (+92 300 0263229) directly.';
      } else if (status === 503) {
        userMessage =
          'The AI dining assistant is temporarily unavailable in this environment. You can still browse the menu and prepare your request using the reservation form or WhatsApp (+92 300 0263229).';
      } else if (status === 400 || status === 403 || errMsg.includes('API_KEY') || errMsg.includes('API key') || errMsg.includes('PERMISSION_DENIED')) {
        userMessage =
          'The AI dining assistant could not verify credentials in this environment. Please use the reservation form or WhatsApp (+92 300 0263229).';
      } else if (status === 404 || errMsg.includes('NOT_FOUND')) {
        userMessage =
          'The configured Gemini model could not be reached. Please verify GEMINI_MODEL or use the reservation form directly.';
      }
      sendEvent({ type: 'error', message: userMessage, code: status ?? errObj?.name ?? 'error' });
    } finally {
      clearTimeout(timeoutId);
      res.end();
    }
  });
}
