# Integración Pedidos → CRM

**Dominio:** Pedidos (P03)
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
  "cliente_nombre": "María González",
  "cliente_email": "maria@email.com",
  "cliente_telefono": "+56912345678",
  "pedido_id_ref": "PED-12345"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `asunto` | `string` | Sí | Motivo del ticket. |
| `descripcion` | `string` | Sí | Detalle. Se guarda como interacción. |
| `prioridad` | `string` | Sí | `"baja"`, `"media"`, `"alta"`, `"critica"`. |
| `sistema_origen` | `string` | Sí | Siempre `"pedidos"`. |
| `sistema_id` | `string` | Sí | Siempre `"P03"`. |
| `cliente_nombre` | `string` | Sí | Nombre completo del cliente. |
| `cliente_email` | `string` | Sí | Email del cliente. Se usa para buscar o crear. |
| `cliente_telefono` | `string` | No | Teléfono del cliente. |
| `pedido_id_ref` | `string` | No | ID del pedido. |
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
    "cliente_nombre": "María González",
    "fecha_vencimiento_sla": "2026-07-04T01:33:57.706Z",
    "pedido_id_ref": "PED-12345",
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

La `descripcion` se crea automáticamente como interacción en el ticket:

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

## Consultar estado del ticket

```
GET https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo/:id?api_key=pedidos_secret_p03
```

### Respuesta

```json
{
  "ok": true,
  "ticket": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "asunto": "Pedido con error en envío",
    "estado": "abierto",
    "prioridad": "media",
    "canal": "email",
    "cliente_nombre": "María González",
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
    "x-api-key": "pedidos_secret_p03"
  },
  body: JSON.stringify({
    asunto: "Pedido con error en envío",
    descripcion: "El courier reportó dirección incorrecta",
    prioridad: "media",
    sistema_origen: "pedidos",
    sistema_id: "P03",
    cliente_nombre: "María González",
    cliente_email: "maria@email.com",
    cliente_telefono: "+56912345678",
    pedido_id_ref: "PED-12345"
  })
});

const { ok, ticket } = await response.json();

// Consultar estado
const status = await fetch(
  `https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo/${ticket.id}?api_key=pedidos_secret_p03`
);
const { ticket: actual } = await status.json();
console.log(actual.estado); // "abierto"
```
