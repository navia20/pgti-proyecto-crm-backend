# Integración Suscripciones → CRM

**Dominio:** Suscripciones (P10)
**Versión:** `v1.3`
**Fecha:** 3 de julio de 2026

---

## Endpoint

```
POST https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo
```

### Headers

```
Content-Type: application/json
x-api-key: suscripciones_secret_p10
```

---

## Crear ticket

### Payload

```json
{
  "asunto": "Cobro de suscripción fallido",
  "descripcion": "3 intentos de cobro rechazados por el banco",
  "prioridad": "alta",
  "sistema_origen": "suscripciones",
  "sistema_id": "P10",
  "cliente_nombre": "Carlos López",
  "cliente_email": "carlos@email.com",
  "cliente_telefono": "+56987654321",
  "suscripcion_id_ref": "SUB-8812"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `asunto` | `string` | Sí | Motivo del ticket. |
| `descripcion` | `string` | No | Detalle. Se guarda como interacción. |
| `prioridad` | `string` | Sí | `"baja"`, `"media"`, `"alta"`, `"critica"`. |
| `sistema_origen` | `string` | Sí | Siempre `"suscripciones"`. |
| `sistema_id` | `string` | Sí | Siempre `"P10"`. |
| `cliente_nombre` | `string` | Sí | Nombre completo del cliente. |
| `cliente_email` | `string` | Sí | Email del cliente. Se usa para buscar o crear. |
| `cliente_telefono` | `string` | No | Teléfono del cliente. |
| `suscripcion_id_ref` | `string` | No | ID de la suscripción. |
| `pedido_id_ref` | `string` | No | ID del pedido (si aplica). |
| `contexto` | `string` | No | Info adicional libre. |

### Respuesta (201)

```json
{
  "ok": true,
  "ticket": {
    "id": "5be148c6-5091-4a44-922d-82996a194983",
    "asunto": "Cobro de suscripción fallido",
    "estado": "abierto",
    "prioridad": "alta",
    "canal": "email",
    "cliente_id": 12345,
    "cliente_nombre": "Carlos López",
    "fecha_vencimiento_sla": "2026-07-04T01:33:57.706Z",
    "suscripcion_id_ref": "SUB-8812",
    "creado_en": "2026-07-03T01:33:57.383Z",
    "actualizado_en": "2026-07-03T01:33:57.383Z"
  }
}
```

---

## Find or Create de Cliente

Al crear un ticket, el CRM busca o crea el cliente automáticamente:

| Escenario | Resultado |
|-----------|-----------|
| Viene `cliente_email` que ya existe | Se usa el cliente existente |
| Viene `cliente_telefono` que ya existe | Se usa el cliente existente |
| No existe ningún cliente con esos datos | Se crea uno nuevo con nombre, email y teléfono |
| No viene ningún dato de cliente | El ticket queda sin cliente asociado |

Prioridad de búsqueda: `cliente_email` → `cliente_telefono` → crear nuevo.

---

## Interacción automática

Si se envía `descripcion`, se crea automáticamente una interacción en el ticket:

```json
{
  "id": "f51c8595-169e-42a9-9482-ea16bcc04e3e",
  "ticket_id": "5be148c6-5091-4a44-922d-82996a194983",
  "autor_tipo": "sistema",
  "autor_id": "SUB-8812",
  "contenido": "3 intentos de cobro rechazados por el banco",
  "es_nota_interna": false
}
```

---

## Alerta de incidentes

Si la prioridad es `"critica"`, se envía automáticamente una alerta al módulo de incidentes.

---

## Consultar estado del ticket

```
GET https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo/:id?api_key=suscripciones_secret_p10
```

### Respuesta

```json
{
  "ok": true,
  "ticket": {
    "id": "5be148c6-5091-4a44-922d-82996a194983",
    "asunto": "Cobro de suscripción fallido",
    "estado": "abierto",
    "prioridad": "alta",
    "canal": "email",
    "cliente_nombre": "Carlos López",
    "fecha_vencimiento_sla": "2026-07-04T01:33:57.706Z",
    "creado_en": "2026-07-03T01:33:57.383Z",
    "actualizado_en": "2026-07-03T01:33:57.383Z"
  }
}
```

---

## Ejemplo en código

```javascript
// Crear ticket
const response = await fetch("https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "suscripciones_secret_p10"
  },
  body: JSON.stringify({
    asunto: "Cobro de suscripción fallido",
    descripcion: "3 intentos de cobro rechazados por el banco",
    prioridad: "alta",
    sistema_origen: "suscripciones",
    sistema_id: "P10",
    cliente_nombre: "Carlos López",
    cliente_email: "carlos@email.com",
    cliente_telefono: "+56987654321",
    suscripcion_id_ref: "SUB-8812"
  })
});

const { ok, ticket } = await response.json();

// Consultar estado
const status = await fetch(
  `https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo/${ticket.id}?api_key=suscripciones_secret_p10`
);
const { ticket: actual } = await status.json();
console.log(actual.estado); // "abierto"
```
