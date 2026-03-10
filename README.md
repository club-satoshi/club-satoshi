# Club Satoshi

Sitio web oficial de [Club Satoshi](https://clubsatoshi.org), comunidad bitcoiner de Tucumán y el Norte Argentino. Construido con [Next.js](https://nextjs.org).

## Primeros pasos

Instalá las dependencias y levantá el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador para ver los cambios.

---

## Colaborar con contenido

Los artículos y guías del sitio se gestionan en `content/resources/` mediante archivos `.mdx`. Cualquier persona puede contribuir para fortalecer la educación sobre Bitcoin en la región.

### Estructura de archivos

```text
content/
└── resources/
    ├── que-es-bitcoin.mdx
    ├── mi-primer-compra-satoshis.mdx
    ├── mi-primer-billetera-bitcoin.mdx
    ├── lightning-network.mdx
    ├── billeteras-frias.mdx
    └── glosario-bitcoin.mdx
```

### Cómo crear un nuevo artículo

1. **Crear el archivo:** En `content/resources/` con nombre en minúsculas y guiones (ej: `como-funciona-el-halving.mdx`).

2. **Configurar el Frontmatter:** Copiá y completá este bloque al inicio del archivo:

```mdx
---
title: "Título del artículo"
category: "fundamentos"       # fundamentos | guias | herramientas
description: "Descripción breve para las tarjetas de previsualización."
date: "2026-03-10"            # Formato YYYY-MM-DD
author: "Tu nombre o alias"
type: "article"               # article | guide
level: "beginner"             # beginner | intermediate | advanced
---

Contenido del artículo en Markdown...
```

3. **Escribir el contenido:** Usá Markdown estándar para títulos, listas, citas y bloques de código.

4. **Registro visual:** Para que el artículo aparezca en la sección de Recursos, agregá la tarjeta correspondiente en `src/components/Resources.tsx`.

### Buenas prácticas

- **Tono:** Didáctico, accesible y con impronta local (Tucumán).
- **Soberanía:** Priorizá siempre soluciones no custodiales y de código abierto.
- **Claridad:** Explicá términos técnicos (UTXO, Mempool, Hash, etc.) antes de usarlos.
- **Actualización:** Verificá que la fecha (`date`) sea la del día de creación o última edición.

---

## Despliegue

El sitio se despliega automáticamente en **Vercel** tras cada push a la rama `main`.