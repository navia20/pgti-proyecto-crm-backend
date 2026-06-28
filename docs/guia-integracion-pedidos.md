# Integración Pedidos → CRM

**Dominio:** Pedidos (P03)
**Versión:** `v1.1`
**Fecha:** 28 de junio de 2026

---

## Endpoint

```
POST https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo
```

### Headers

```
Content-Type: application/json
x-api-key: pedidos_secret_p03
```

---

## Crear ticket

### Payload

```json
{
  "asunto": "Pedido con error en envío",
  "descripcion": "El courier reportó dirección incorrecta",
  "prioridad": "media",
  "sistema_origen": "pedidos",
  "sistema_id": "P03",
  "cliente_id": 12345,
  "pedido_id_ref": "PED-12345"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `asunto` | `string` | Sí | Motivo del ticket. |
| `descripcion` | `string` | No | Detalle. Se guarda como interacción con autor_id = `pedido_id_ref`. |
| `prioridad` | `string` | Sí | `"baja"`, `"media"`, `"alta"`, `"critica"`. |
| `sistema_origen` | `string` | Sí | Siempre `"pedidos"`. |
| `sistema_id` | `string` | Sí | Siempre `"P03"`. |
| `cliente_id` | `number` | No | ID del cliente. |
| `pedido_id_ref` | `string` | No | ID del pedido. Se usa como `autor_id` en la interacción. |
| `suscripcion_id_ref` | `string` | No | ID de la suscripción (si aplica). |
| `contexto` | `string` | No | Info adicional libre. |

### Respuesta (201)

```json
{
  "ok": true,
  "ticket": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "asunto": "Pedido con error en envío",
    "estado": "abierto",
    "prioridad": "media",
    "canal": "email",
    "cliente_id": 12345,
    "agente_id": null,
    "fecha_vencimiento_sla": "2026-06-30T01:33:57.706Z",
    "pedido_id_ref": "PED-12345",
    "suscripcion_id_ref": null,
    "creado_en": "2026-06-28T01:33:57.383Z",
    "actualizado_en": "2026-06-28T01:33:57.383Z"
  }
}
```

---

## Interacción automática

Si se envía `descripcion`, se crea automáticamente una interacción en el ticket:

```json
{
  "id": "86866d69-f22c-4d16-9042-8b5c942d70f8",
  "ticket_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "autor_tipo": "sistema",
  "autor_id": "PED-12345",
  "contenido": "El courier reportó dirección incorrecta",
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
    "x-api-key": "pedidos_secret_p03"
  },
  body: JSON.stringify({
    asunto: "Pedido con error en envío",
    descripcion: "El courier reportó dirección incorrecta",
    prioridad: "media",
    sistema_origen: "pedidos",
    sistema_id: "P03",
    cliente_id: 4589,
    pedido_id_ref: "PED-12345"
  })
});

const data = await response.json();
// { ok: true, ticket: { ... } }
```
