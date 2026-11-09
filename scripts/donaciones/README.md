# Recolector de donaciones

Lee la sub-wallet de donaciones de Alby Hub por Nostr Wallet Connect (NWC) con `@getalby/sdk` y publica dos totales en la rama huérfana `donaciones`, que la web consume desde `raw.githubusercontent.com`.

- `balance_sats`: saldo actual de la sub-wallet (`get_balance`).
- `received_sats`: suma de las transacciones entrantes y liquidadas (`settled_at`) desde `2026-11-09T16:00:00Z`, recorriendo todas las páginas de `list_transactions`.

NWC devuelve los montos en milisatoshis; se suman en msat y se convierten a sats redondeando hacia abajo. Si NWC falla, no responde a tiempo o devuelve algo inconsistente, el script no escribe nada y termina con error.

Lo corre `.github/workflows/donaciones.yml` cada 30 minutos (y a mano con *Run workflow*).

## Secret

En GitHub: *Settings → Secrets and variables → Actions → New repository secret*, nombre `NWC_URL`, valor `nostr+walletconnect://...`.

La conexión NWC tiene que tener solo los permisos de leer saldo, listar transacciones y crear facturas. Nunca permisos de pago.

## Correrlo a mano

```bash
cd scripts/donaciones
npm ci
npm test
NWC_URL='nostr+walletconnect://...' npm start -- /tmp/donaciones.json
```

El archivo solo se escribe si cambió algún número o si `checked_at` tiene más de 2 horas.

## Qué se publica

Archivo `data/donaciones.json` en la rama `donaciones` (lo único que contiene esa rama):

```json
{
  "since": "2026-11-09T16:00:00Z",
  "received_sats": 0,
  "balance_sats": 0,
  "data_changed_at": "2026-11-09T16:30:00Z",
  "checked_at": "2026-11-09T16:30:00Z"
}
```

`data_changed_at` cambia solo cuando cambian los números; `checked_at`, en cada escritura. En los logs públicos de Actions solo se imprimen los dos totales: nunca el string NWC, transacciones, facturas ni preimages. La salida propia del SDK se silencia.
