# Integración Salud → CRM

**Dominio:** Salud (P01)
**Versión:** `v1.2`
**Fecha:** 3 de julio de 2026

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
  "cliente_nombre": "Ana Torres",
  "cliente_email": "ana@email.com",
  "cliente_telefono": "+56911223344",
  "salud_ref": "SAL-77777"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `asunto` | `string` | Sí | Motivo del ticket. |
| `descripcion` | `string` | Sí | Detalle del problema. Se guarda como interacción. |
| `prioridad` | `string` | Sí | `"baja"`, `"media"`, `"alta"`, `"critica"`. |
| `sistema_origen` | `string` | Sí | Siempre `"salud"`. |
| `sistema_id` | `string` | Sí | Siempre `"P01"`. |
| `cliente_nombre` | `string` | Sí | Nombre completo del cliente. |
| `cliente_email` | `string` | Sí | Email del cliente. Se usa para buscar o crear. |
| `cliente_telefono` | `string` | No | Teléfono del cliente. |
| `salud_ref` | `string` | No | ID de referencia de salud. |
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
    "cliente_nombre": "Ana Torres",
    "fecha_vencimiento_sla": "2026-07-04T08:33:57.706Z",
    "salud_ref": "SAL-77777",
    "creado_en": "2026-07-03T08:33:57.383Z",
    "actualizado_en": "2026-07-03T08:33:57.383Z"
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

La `descripcion` se crea automáticamente como interacción en el ticket:

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

## Consultar estado del ticket

```
GET https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo/:id?api_key=salud_secret_p01
```

### Respuesta

```json
{
  "ok": true,
  "ticket": {
    "id": "b9c93b3e-fa1d-4e25-ab4a-6aac0deff27c",
    "asunto": "Alerta de salud del sistema",
    "estado": "abierto",
    "prioridad": "media",
    "canal": "email",
    "cliente_nombre": "Ana Torres",
    "fecha_vencimiento_sla": "2026-07-04T08:33:57.706Z",
    "creado_en": "2026-07-03T08:33:57.383Z",
    "actualizado_en": "2026-07-03T08:33:57.383Z"
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
    "x-api-key": "salud_secret_p01"
  },
  body: JSON.stringify({
    asunto: "Alerta de salud del sistema",
    descripcion: "El sensor reporta temperatura fuera de rango",
    prioridad: "media",
    sistema_origen: "salud",
    sistema_id: "P01",
    cliente_nombre: "Ana Torres",
    cliente_email: "ana@email.com",
    cliente_telefono: "+56911223344",
    salud_ref: "SAL-77777"
  })
});

const { ok, ticket } = await response.json();

// Consultar estado
const status = await fetch(
  `https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo/${ticket.id}?api_key=salud_secret_p01`
);
const { ticket: actual } = await status.json();
console.log(actual.estado); // "abierto"
```
