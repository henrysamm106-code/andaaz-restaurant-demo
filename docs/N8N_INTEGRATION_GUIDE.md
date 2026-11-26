# Andaaz Restaurant — n8n Integration & API Contracts

All integration endpoints are hosted server-side and protect credentials in environment variables (`N8N_INTEGRATION_SECRET`, `N8N_CHAT_WEBHOOK_URL`, `N8N_STATUS_WEBHOOK_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

---

## Authentication

All `POST /api/integrations/n8n/*` routes require:

```http
Authorization: Bearer <N8N_INTEGRATION_SECRET>
Content-Type: application/json
```

Missing or invalid tokens return `401 Unauthorized`. If `N8N_INTEGRATION_SECRET` is not set on the server, protected integration routes return `503 Service Unavailable`.

---

## 1. `GET /api/integrations/n8n/health`

Verifies the integration bridge is reachable without exposing customer records or secrets.

**Response `200 OK`:**
```json
{
  "ok": true,
  "service": "andaaz-n8n-integration",
  "storageMode": "supabase",
  "authConfigured": true,
  "karachiDate": "2026-11-25",
  "karachiTime": "22:10"
}
```

---

## 2. `GET /api/integrations/n8n/availability`

Returns configured operating days, time slots, closure dates, and advisory seating rules (no customer PII). Supports optional `?date=YYYY-MM-DD`.

**Response `200 OK`:**
```json
{
  "ok": true,
  "timezone": "Asia/Karachi",
  "advisoryOnly": true,
  "requireManagerApproval": true,
  "hoursConfigured": false,
  "openingTime": null,
  "closingTime": null,
  "operatingDays": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
  "timeSlots": ["17:00","18:00","19:00","20:00","21:00","22:00"],
  "reservationDurationMinutes": 120,
  "capacityConfigured": false,
  "rooftopCapacity": null,
  "indoorCapacity": null,
  "maxGuestCount": null,
  "closureDates": [],
  "requestedDateClosed": false
}
```

---

## 3. `POST /api/integrations/n8n/reservations`

Ingests a structured reservation request from the external n8n WhatsApp AI Agent. Always persists with `status: "pending"` (never auto-confirms) and deduplicates via `external_event_id`.

**Headers:** `Authorization: Bearer <N8N_INTEGRATION_SECRET>`, `Content-Type: application/json`

**Request Body:**
```json
{
  "external_event_id": "andaaz-demo-reservation-001",
  "customer_name": "Ahmed Ali",
  "customer_phone": "+923000000000",
  "reservation_date": "2026-11-28",
  "reservation_time": "20:00",
  "guest_count": 4,
  "seating_preference": "rooftop",
  "special_occasion": "Anniversary",
  "special_requests": "Best possible view of Badshahi Mosque",
  "dietary_requirements": "None",
  "source": "whatsapp_ai",
  "conversation_id": "demo-session-001",
  "customer_confirmed_details": true,
  "is_demo": true
}
```

**Success `201 Created` (or `200 OK` if `duplicate: true`):**
```json
{
  "ok": true,
  "duplicate": false,
  "reservation": {
    "id": "uuid",
    "booking_reference": "ANZ-2611-4821",
    "status": "pending",
    "source": "whatsapp_ai",
    "is_demo": true,
    "created_at": "2026-11-25T17:12:00.000Z"
  }
}
```

**Errors:** `400 Bad Request` (validation failure), `401 Unauthorized`, `503 Service Unavailable`.

---

## 4. `POST /api/integrations/n8n/conversations`

Upserts AI conversation metadata and deduplicated messages (`external_message_id`).

**Request Body:**
```json
{
  "external_session_id": "demo-session-001",
  "customer_identifier": "+923000000000",
  "customer_name": "Ahmed Ali",
  "source": "whatsapp_ai",
  "status": "reservation_requested",
  "detected_intent": "anniversary_reservation",
  "linked_reservation_id": null,
  "response_latency_ms": 1350,
  "needs_human_assistance": false,
  "is_demo": true,
  "messages": [
    {
      "external_message_id": "msg-001",
      "sender": "customer",
      "content": "We want a rooftop table for 4 on Nov 28 at 8 PM."
    },
    {
      "external_message_id": "msg-002",
      "sender": "assistant",
      "content": "I have recorded your Pending request for 4 guests.",
      "latency_ms": 1350
    }
  ]
}
```

---

## 5. `POST /api/integrations/n8n/events`

Logs n8n workflow execution results, notification delivery receipts, or integration errors.

**Request Body:**
```json
{
  "external_event_id": "n8n-evt-9001",
  "event_type": "whatsapp.manager_alert.sent",
  "source": "n8n",
  "status": "success",
  "http_status": 200,
  "summary": "Delivered manager WhatsApp notification for ANZ-2611-4821.",
  "is_demo": true
}
```

---

## 6. Outbound Manager Status Webhook (`N8N_STATUS_WEBHOOK_URL`)

When a manager approves, rejects, cancels, or reschedules a reservation, the server sends a `POST` request to `N8N_STATUS_WEBHOOK_URL` with `Authorization: Bearer <N8N_INTEGRATION_SECRET>` and payload:

```json
{
  "event_id": "status-evt-uuid",
  "event_type": "reservation.confirmed",
  "booking_reference": "ANZ-2611-4821",
  "reservation_id": "uuid",
  "status": "confirmed",
  "customer_name": "Ahmed Ali",
  "customer_phone": "+923000000000",
  "reservation_date": "2026-11-28",
  "reservation_time": "20:00",
  "guest_count": 4,
  "seating_preference": "rooftop",
  "conversation_id": "demo-session-001",
  "is_demo": false
}
```
