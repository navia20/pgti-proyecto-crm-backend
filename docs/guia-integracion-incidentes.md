# Guías de Integración - CRM

**Dominio:** CRM (P07)
**Versión:** `v1.1`
**Fecha:** 24 de junio de 2026

---

## 1. Dominios externos → CRM: Creación de tickets

Cualquier dominio externo (Pedidos, Suscripciones, Pagos, IoT, Inventario, Salud) puede crear tickets en el CRM usando este endpoint.

### Endpoint

```
POST http://localhost:3001/api/v1/tickets/externo
```

En producción:
```
POST https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo
```

### Headers

```
Content-Type: application/json
x-api-key: <clave del dominio>
```

### Payload

```json
{
  "asunto": "Pago fallido",
  "descripcion": "Error 502 en pasarela de cobro",
  "prioridad": "alta",
  "sistema_origen": "pagos",
  "sistema_id": "P04",
  "cliente_id": 12345,
  "pedido_id_ref": "PED-12345",
  "suscripcion_id_ref": "SUB-8812"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `asunto` | `string` | Sí | Asunto del ticket. |
| `descripcion` | `string` | No | Se concatena al asunto: `"asunto - descripcion"`. |
| `prioridad` | `string` | Sí | `"baja"`, `"media"`, `"alta"`, `"critica"`. |
| `sistema_origen` | `string` | Sí | Dominio que crea el ticket. Ver tabla abajo. |
| `sistema_id` | `string` | Sí | ID del sistema de origen (ej: `"P03"`, `"P04"`). |
| `cliente_id` | `number` | No | ID del cliente afectado. |
| `pedido_id_ref` | `string` | No | Referencia al pedido. |
| `suscripcion_id_ref` | `string` | No | Referencia a la suscripción. |
| `contexto` | `string` | No | Información adicional libre. |

### Valores de `sistema_origen`

| Valor | Dominio |
|---|---|
| `"pedidos"` | Proyecto 3 - Pedidos |
| `"suscripciones"` | Proyecto 10 - Suscripciones |
| `"pagos"` | Proyecto 4 - Pasarela de pagos |
| `"iot"` | Proyecto 9 - IoT |
| `"inventario"` | Proyecto 5 - Inventario |
| `"salud"` | Proyecto 1 - Salud |

### API Keys por dominio

| Dominio | x-api-key |
|---|---|
| Pedidos | `pedidos_secret_p03` |
| Suscripciones | `suscripciones_secret_p10` |
| Pagos | `pagos_secret_p04` |
| IoT | `iot_secret_p09` |
| Inventario | `inventario_secret_p05` |
| Salud | `salud_secret_p01` |

### Respuesta exitosa (201)

```json
{
  "ok": true,
  "ticket": {
    "id": "b7c21fd7-ff34-4c81-82e7-c9ab9cbc6e72",
    "asunto": "Pago fallido - Error 502 en pasarela de cobro",
    "estado": "abierto",
    "prioridad": "alta",
    "canal": "email",
    "cliente_id": 12345,
    "agente_id": null,
    "fecha_vencimiento_sla": "2026-06-24T21:33:57.706Z",
    "pedido_id_ref": "PED-12345",
    "suscripcion_id_ref": null,
    "creado_en": "2026-06-24T01:33:57.383Z",
    "actualizado_en": "2026-06-24T01:33:57.383Z"
  }
}
```

### Respuesta con API key inválida

```json
{
  "ok": false,
  "message": "API key inválida para este sistema"
}
```

### Notas

- `canal` se asigna automáticamente como `"email"`.
- Si la prioridad es `"critica"`, se envía notificación al Grupo de Incidentes (pendiente de habilitar).
- El ticket se crea con estado `"abierto"` y SLA calculado según prioridad.

---

## 2. CRM → Grupo de Incidentes 11

Cuando se crea un ticket con prioridad **crítica** en el CRM, se envía una alerta al Grupo de Incidentes 11.

> **Estado:** Pendiente. El endpoint de Incidentes (`/api/v1/alertas`) devuelve 404. Se habilitará cuando esté disponible.

### Endpoint

```
POST https://mochicode-backend.onrender.com/api/v1/alertas
```

### Headers

```
Content-Type: application/json
x-api-key: <clave que proporciona el Grupo de Incidentes>
```

### Payload

```json
{
  "sistema_id": "P07",
  "creado_en": "2026-06-23T21:00:00.000Z",
  "payload": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "asunto": "Caída masiva pasarela de pagos",
    "estado": "abierto",
    "prioridad": "critica",
    "canal": "email",
    "cliente_id": 12345,
    "agente_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fecha_vencimiento_sla": "2026-06-24T05:00:00.000Z",
    "pedido_id_ref": "P04",
    "suscripcion_id_ref": null,
    "creado_en": "2026-06-23T21:00:00.000Z",
    "actualizado_en": "2026-06-23T21:00:00.000Z"
  }
}
```

### Variables de entorno

```
INCIDENTES_SERVICE_URL=https://mochicode-backend.onrender.com
INCIDENTES_API_KEY=<clave del Grupo de Incidentes>
```

---

## 3. Variables de entorno del backend

```
# Conexión a Incidentes
INCIDENTES_SERVICE_URL=https://mochicode-backend.onrender.com
INCIDENTES_API_KEY=auth_p07_secret

# API Keys de dominios externos
PEDIDOS_API_KEY=pedidos_secret_p03
SUSCRIPCIONES_API_KEY=suscripciones_secret_p10
PAGOS_API_KEY=pagos_secret_p04
IOT_API_KEY=iot_secret_p09
INVENTARIO_API_KEY=inventario_secret_p05
SALUD_API_KEY=salud_secret_p01
```
