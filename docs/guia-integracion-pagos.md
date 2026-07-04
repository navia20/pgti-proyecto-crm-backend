# Integración Pagos → CRM

**Dominio:** Pagos (P04)
**Versión:** `v1.1`
**Fecha:** 4 de julio de 2026

---

## Endpoint

```
POST https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo
```

### Headers

```
Content-Type: application/json
x-api-key: pagos_secret_p04
```

---

## Crear ticket

### Payload

```json
{
  "asunto": "Cargo duplicado en factura",
  "descripcion": "Se realizó doble cobro por el mismo pedido",
  "prioridad": "critica",
  "sistema_origen": "pagos",
  "sistema_id": "P04",
  "cliente_nombre": "María González",
  "cliente_email": "maria@email.com",
  "cliente_telefono": "+56912345678",
  "pago_id_ref": "PAGO-55555"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `asunto` | `string` | Sí | Motivo del ticket. |
| `descripcion` | `string` | No | Detalle del problema. Se guarda como interacción con autor_id = `pago_id_ref`. |
| `prioridad` | `string` | Sí | `"baja"`, `"media"`, `"alta"`, `"critica"`. |
| `sistema_origen` | `string` | Sí | Siempre `"pagos"`. |
| `sistema_id` | `string` | Sí | Siempre `"P04"`. |
| `cliente_nombre` | `string` | Sí | Nombre completo del cliente. |
| `cliente_email` | `string` | Sí | Email del cliente. Se usa para buscar o crear. |
| `cliente_telefono` | `string` | No | Teléfono del cliente. |
| `pago_id_ref` | `string` | No | ID del pago. Se usa como `autor_id` en la interacción. |
| `pedido_id_ref` | `string` | No | ID del pedido (si aplica). |
| `suscripcion_id_ref` | `string` | No | ID de la suscripción (si aplica). |
| `contexto` | `string` | No | Info adicional libre. |

### Respuesta (201)

```json
{
  "ok": true,
  "ticket": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "asunto": "Cargo duplicado en factura",
    "estado": "abierto",
    "prioridad": "critica",
    "canal": "email",
    "cliente_id": 12345,
    "cliente_nombre": "María González",
    "agente_id": null,
    "fecha_vencimiento_sla": "2026-06-28T16:33:57.706Z",
    "pedido_id_ref": null,
    "suscripcion_id_ref": null,
    "pago_id_ref": "PAGO-55555",
    "salud_ref": null,
    "creado_en": "2026-06-28T08:33:57.383Z",
    "actualizado_en": "2026-06-28T08:33:57.383Z"
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
  "ticket_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "autor_tipo": "sistema",
  "autor_id": "PAGO-55555",
  "contenido": "Se realizó doble cobro por el mismo pedido",
  "es_nota_interna": false
}
```

---

## Alerta de incidentes

Si la prioridad es `"critica"`, se envía automáticamente una alerta al módulo de incidentes.

---

## Consultar estado del ticket

```
GET https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo/:id?api_key=pagos_secret_p04
```

### Caso 1: Ticket abierto (sin resolución)

```json
{
  "ok": true,
  "ticket": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "asunto": "Cargo duplicado en factura",
    "estado": "abierto",
    "prioridad": "critica",
    "canal": "email",
    "cliente_nombre": "María González",
    "resolucion": null,
    "pedido_id_ref": null,
    "suscripcion_id_ref": null,
    "pago_id_ref": "PAGO-55555",
    "salud_ref": null,
    "fecha_vencimiento_sla": "2026-06-28T16:33:57.706Z",
    "creado_en": "2026-06-28T08:33:57.383Z",
    "actualizado_en": "2026-06-28T08:33:57.383Z"
  }
}
```

### Caso 2: Ticket resuelto (con resolución)

```json
{
  "ok": true,
  "ticket": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "asunto": "Cargo duplicado en factura",
    "estado": "resuelto",
    "prioridad": "critica",
    "canal": "email",
    "cliente_nombre": "María González",
    "resolucion": "Se reembolsó el monto duplicado al cliente",
    "pedido_id_ref": null,
    "suscripcion_id_ref": null,
    "pago_id_ref": "PAGO-55555",
    "salud_ref": null,
    "fecha_vencimiento_sla": "2026-06-28T16:33:57.706Z",
    "creado_en": "2026-06-28T08:33:57.383Z",
    "actualizado_en": "2026-06-28T12:30:00.000Z"
  }
}
```

### Campos de respuesta

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | ID del ticket en el CRM. |
| `asunto` | `string` | Motivo del ticket. |
| `estado` | `string` | `"abierto"`, `"progreso"`, `"resuelto"` o `"cerrado"`. |
| `prioridad` | `string` | `"baja"`, `"media"`, `"alta"` o `"critica"`. |
| `resolucion` | `string \| null` | Texto de resolución cuando `estado` es `"resuelto"` o `"cerrado"`. |
| `pago_id_ref` | `string` | ID del pago asociado. |
| `fecha_vencimiento_sla` | `string` | Fecha límite según la prioridad. |

---

## Ejemplo en código

```javascript
// Crear ticket
const response = await fetch("https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "pagos_secret_p04"
  },
  body: JSON.stringify({
    asunto: "Cargo duplicado en factura",
    descripcion: "Se realizó doble cobro por el mismo pedido",
    prioridad: "critica",
    sistema_origen: "pagos",
    sistema_id: "P04",
    cliente_nombre: "María González",
    cliente_email: "maria@email.com",
    cliente_telefono: "+56912345678",
    pago_id_ref: "PAGO-55555"
  })
});

const { ok, ticket } = await response.json();

// Consultar estado
const status = await fetch(
  `https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo/${ticket.id}?api_key=pagos_secret_p04`
);
const { ticket: actual } = await status.json();
console.log(actual.estado); // "abierto"
console.log(actual.resolucion); // null (aún no resuelto)
console.log(actual.pago_id_ref); // "PAGO-55555"

// Cuando se resuelva, resolucion tendrá el texto:
// actual.resolucion = "Se reembolsó el monto duplicado al cliente"
```
