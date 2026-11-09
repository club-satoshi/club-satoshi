# Recolector de donaciones

Lee la sub-wallet de donaciones de Alby Hub por Nostr Wallet Connect (NWC) con `@getalby/sdk` y publica dos totales en la rama huérfana `donaciones`, que la web consume desde `raw.githubusercontent.com`.

- `balance_sats`: saldo actual de la sub-wallet (`get_balance`).
- `received_sats`: suma de todas las transacciones entrantes y liquidadas de la sub-wallet, sin fecha de corte, recorriendo todas las páginas de `list_transactions`.

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

El archivo solo se escribe si cambió algún número o si `checked_at` tiene más de 2 horas.

## Qué se publica

Archivo `data/donaciones.json` en la rama `donaciones` (lo único que contiene esa rama):

```json
{
  "received_sats": 0,
  "balance_sats": 0,
  "data_changed_at": "2026-11-09T16:30:00Z",
  "checked_at": "2026-11-09T16:30:00Z"
}
```

`data_changed_at` cambia solo cuando cambian los números; `checked_at`, en cada escritura. En los logs públicos de Actions solo se imprimen los dos totales: nunca el string NWC, transacciones, facturas ni preimages. La salida propia del SDK se silencia.
