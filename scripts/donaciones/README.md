# Recolector de donaciones

Lee la sub-wallet de donaciones de Alby Hub por Nostr Wallet Connect (NWC) con `@getalby/sdk` y publica los totales y el historial en la rama huérfana `donaciones`, que la web consume desde `raw.githubusercontent.com`.

- `balance_sats`: saldo actual de la sub-wallet (`get_balance`).
- `received_sats`: suma de todas las transacciones entrantes y liquidadas de la sub-wallet, sin fecha de corte, recorriendo todas las páginas de `list_transactions`.
- `donaciones`: hasta 50 pagos entrantes liquidados, del más nuevo al más viejo. De cada uno se publican un id opaco, los sats, la fecha y, si hay, el mensaje (`metadata.comment`, o si no la descripción de la factura). No se publican factura, preimage, payment hash ni datos del pagador.

NWC devuelve los montos en milisatoshis; se suman en msat y se convierten a sats redondeando hacia abajo. Si NWC falla, no responde a tiempo o devuelve algo inconsistente, el script no escribe nada y termina con error.

Lo corre `.github/workflows/donaciones.yml` cada 30 minutos (y a mano con *Run workflow*).

## Secret

El secret vive en el Environment `donaciones`, restringido a `main`, para que un workflow de otra rama no pueda leerlo:

1. *Settings → Environments → New environment*, nombre `donaciones`.
2. *Deployment branches and tags → Selected branches and tags → Add rule*: `main`.
3. *Environment secrets → Add secret*: nombre `NWC_URL`, valor `nostr+walletconnect://...`.

No lo cargues como secret de repositorio.

El workflow tiene dos jobs: `calcular` corre el SDK con el secret y permiso de solo lectura; `publicar` tiene permiso de escritura, no ejecuta código de terceros y valida el JSON antes de commitearlo.

La conexión NWC tiene que tener solo los permisos de leer saldo, listar transacciones y crear facturas. Nunca permisos de pago.

## Correrlo a mano

```bash
cd scripts/donaciones
npm ci
npm test
NWC_URL='nostr+walletconnect://...' npm start -- /tmp/donaciones.json
```

El archivo solo se escribe si cambió algún número, si cambió el historial, o si `checked_at` tiene más de 2 horas.

Para dejar de publicar un aporte, copiá su `id` desde `data/donaciones.json` a `ocultos.json` (en esta carpeta, en `main`) y esperá la próxima corrida.

## Qué se publica

Archivo `data/donaciones.json` en la rama `donaciones` (lo único que contiene esa rama):

```json
{
  "received_sats": 500,
  "balance_sats": 500,
  "donaciones": [
    {
      "id": "0123456789ab",
      "sats": 500,
      "settled_at": "2026-11-21T23:59:00Z",
      "mensaje": "Saludos desde Myto 21/11/2026"
    }
  ],
  "data_changed_at": "2026-11-09T16:30:00Z",
  "checked_at": "2026-11-09T16:30:00Z"
}
```

`mensaje` se omite cuando el pago no trae un texto publicable. `data_changed_at` cambia cuando cambian los números o el historial; `checked_at`, en cada escritura. En los logs públicos de Actions solo se imprimen los dos totales: nunca el string NWC, mensajes, facturas ni preimages. La salida propia del SDK se silencia.
