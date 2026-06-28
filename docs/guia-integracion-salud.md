# Integración Salud → CRM

**Dominio:** Salud (P01)
**Versión:** `v1.0`
**Fecha:** 28 de junio de 2026

---

## Endpoint

```
POST https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo
```

### Headers

```
Content-Type: application/json
x-api-key: salud_secret_p01
```

---

## Crear ticket

### Payload

```json
{
  "asunto": "Alerta de salud del sistema",
  "descripcion": "El sensor reporta temperatura fuera de rango",
  "prioridad": "media",
  "sistema_origen": "salud",
  "sistema_id": "P01",
  "cliente_id": 12345,
  "salud_ref": "SAL-77777"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `asunto` | `string` | Sí | Motivo del ticket. |
| `descripcion` | `string` | No | Detalle del problema. Se guarda como interacción con autor_id = `salud_ref`. |
| `prioridad` | `string` | Sí | `"baja"`, `"media"`, `"alta"`, `"critica"`. |
| `sistema_origen` | `string` | Sí | Siempre `"salud"`. |
| `sistema_id` | `string` | Sí | Siempre `"P01"`. |
| `cliente_id` | `number` | No | ID del cliente. |
| `salud_ref` | `string` | No | ID de referencia de salud. Se usa como `autor_id` en la interacción. |
| `pedido_id_ref` | `string` | No | ID del pedido (si aplica). |
| `suscripcion_id_ref` | `string` | No | ID de la suscripción (si aplica). |
| `contexto` | `string` | No | Info adicional libre. |

### Respuesta (201)

```json
{
  "ok": true,
  "ticket": {
    "id": "b9c93b3e-fa1d-4e25-ab4a-6aac0deff27c",
    "asunto": "Alerta de salud del sistema",
    "estado": "abierto",
    "prioridad": "media",
    "canal": "email",
    "cliente_id": 12345,
    "agente_id": null,
    "fecha_vencimiento_sla": "2026-06-30T08:33:57.706Z",
    "pedido_id_ref": null,
    "suscripcion_id_ref": null,
    "creado_en": "2026-06-28T08:33:57.383Z",
    "actualizado_en": "2026-06-28T08:33:57.383Z"
  }
}
```

---

## Interacción automática

Si se envía `descripcion`, se crea automáticamente una interacción en el ticket:

```json
{
  "id": "6869b167-0095-4903-b208-ac77ababf03c",
  "ticket_id": "b9c93b3e-fa1d-4e25-ab4a-6aac0deff27c",
  "autor_tipo": "sistema",
  "autor_id": "SAL-77777",
  "contenido": "El sensor reporta temperatura fuera de rango",
  "es_nota_interna": false
}
```

---

## Alerta de incidentes

Si la prioridad es `"critica"`, se envía automáticamente una alerta al módulo de incidentes.

---

## Ejemplo en código

```javascript
const response = await fetch("https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "salud_secret_p01"
  },
  body: JSON.stringify({
    asunto: "Alerta de salud del sistema",
    descripcion: "El sensor reporta temperatura fuera de rango",
    prioridad: "media",
    sistema_origen: "salud",
    sistema_id: "P01",
    cliente_id: 4589,
    salud_ref: "SAL-77777"
  })
});

const data = await response.json();
// { ok: true, ticket: { ... } }
```
