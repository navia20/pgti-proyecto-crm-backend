# Integración Pagos → CRM

**Dominio:** Pagos (P04)
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
  "cliente_id": 12345,
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
| `cliente_id` | `number` | No | ID del cliente. |
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
    "agente_id": null,
    "fecha_vencimiento_sla": "2026-06-28T16:33:57.706Z",
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

## Ejemplo en código

```javascript
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
    cliente_id: 4589,
    pago_id_ref: "PAGO-55555"
  })
});

const data = await response.json();
// { ok: true, ticket: { ... } }
```
