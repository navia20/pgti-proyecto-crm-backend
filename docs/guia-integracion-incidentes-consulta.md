# Integración Incidentes → CRM: Consulta de Estado

**Dominio:** Incidentes (P11)
**Versión:** `v1.0`
**Fecha:** 5 de julio de 2026

---

## Endpoint

```
GET https://pgti-proyecto-crm-backend.vercel.app/api/v1/incidentes/estado-ticket/:id
```

Local:
```
GET http://localhost:3001/api/v1/incidentes/estado-ticket/:id
```

### Headers

```
Content-Type: application/json
```

### Query Parameters

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `api_key` | `string` | Sí | API key de Incidentes: `auth_p07_secret` |
| `id` | `string` (path) | Sí | UUID del ticket en el CRM |

---

## Consultar estado del ticket

### Ejemplo de solicitud

```
GET https://pgti-proyecto-crm-backend.vercel.app/api/v1/incidentes/estado-ticket/bbd7fb0e-5aa1-4b6a-8bb1-3216ea8fd057?api_key=auth_p07_secret
```

### Respuesta exitosa (200)

```json
{
  "ok": true,
  "ticket": {
    "id": "bbd7fb0e-5aa1-4b6a-8bb1-3216ea8fd057",
    "asunto": "Asistencia Informatica",
    "estado": "resuelto",
    "prioridad": "alta",
    "canal": "email",
    "cliente_id": 12,
    "cliente_nombre": "Enzo Inostroza",
    "agente_id": "p7.agent@ucn.cl",
    "fecha_vencimiento_sla": "2026-07-06T07:39:37.606Z",
    "pedido_id_ref": null,
    "suscripcion_id_ref": null,
    "pago_id_ref": null,
    "salud_ref": null,
    "resolucion": "revisar pagina web",
    "creado_en": "2026-07-05T07:39:37.672Z",
    "actualizado_en": "2026-07-05T07:42:16.568Z"
  }
}
```

### Campos de respuesta

| Campo | Tipo | Descripción |
|---|---|---|
| `ok` | `boolean` | `true` si la consulta fue exitosa. |
| `ticket.id` | `string` | UUID del ticket. |
| `ticket.asunto` | `string` | Asunto del ticket. |
| `ticket.estado` | `string` | Estado: `"abierto"`, `"progreso"`, `"resuelto"` o `"cerrado"`. |
| `ticket.prioridad` | `string` | Prioridad: `"baja"`, `"media"`, `"alta"` o `"critica"`. |
| `ticket.canal` | `string` | Canal: `"chat"`, `"email"`, `"telefono"` o `"app"`. |
| `ticket.cliente_id` | `number` | ID del cliente asociado. |
| `ticket.cliente_nombre` | `string` | Nombre del cliente. |
| `ticket.agente_id` | `string` | ID del agente asignado. `null` si no tiene. |
| `ticket.fecha_vencimiento_sla` | `string` | Fecha límite del SLA (ISO 8601). |
| `ticket.pedido_id_ref` | `string` | Referencia al pedido. `null` si no aplica. |
| `ticket.suscripcion_id_ref` | `string` | Referencia a la suscripción. `null` si no aplica. |
| `ticket.pago_id_ref` | `string` | Referencia al pago. `null` si no aplica. |
| `ticket.salud_ref` | `string` | Referencia de salud. `null` si no aplica. |
| `ticket.resolucion` | `string` | Descripción de la resolución. `null` si no está resuelto. |
| `ticket.creado_en` | `string` | Fecha de creación (ISO 8601). |
| `ticket.actualizado_en` | `string` | Última actualización (ISO 8601). |

---

## Estados posibles

| Estado | Descripción |
|---|---|
| `abierto` | Ticket recién creado, sin atención. |
| `progreso` | Un agente está trabajando en el ticket. |
| `resuelto` | Ticket resuelto, esperando confirmación. |
| `cerrado` | Ticket cerrado definitivamente. |

---

## Errores

### Sin api_key

```json
{
  "ok": false,
  "message": "api_key es requerida"
}
```

### API key inválida

```json
{
  "ok": false,
  "message": "API key inválida"
}
```

### Ticket no encontrado

```json
{
  "ok": false,
  "message": "Ticket no encontrado"
}
```

---

## Variables de entorno

```
INCIDENTES_API_KEY=auth_p07_secret
```

---

## Ejemplo en código

```javascript
// Consultar estado de un ticket desde Incidentes
const ticketId = "bbd7fb0e-5aa1-4b6a-8bb1-3216ea8fd057";
const apiKey = "auth_p07_secret";

const response = await fetch(
  `https://pgti-proyecto-crm-backend.vercel.app/api/v1/incidentes/estado-ticket/${ticketId}?api_key=${apiKey}`
);

const { ok, ticket } = await response.json();

if (ok) {
  console.log(`Estado: ${ticket.estado}`);   // "resuelto"
  console.log(`Prioridad: ${ticket.prioridad}`); // "alta"
} else {
  console.error(`Error: ${ticket.message}`);
}
```

```python
# Python
import requests

ticket_id = "bbd7fb0e-5aa1-4b6a-8bb1-3216ea8fd057"
api_key = "auth_p07_secret"

response = requests.get(
    f"https://pgti-proyecto-crm-backend.vercel.app/api/v1/incidentes/estado-ticket/{ticket_id}",
    params={"api_key": api_key}
)

data = response.json()
if data["ok"]:
    print(f"Estado: {data['ticket']['estado']}")
    print(f"Prioridad: {data['ticket']['prioridad']}")
else:
    print(f"Error: {data['message']}")
```
