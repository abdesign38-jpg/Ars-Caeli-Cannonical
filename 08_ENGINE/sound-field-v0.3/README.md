# AEON Sound Field v0.3.0

Interfaz neuroenergética y alquímica de sesión para Ars Caeli.

## Diseño

La versión 0.3 reemplaza el panel técnico anterior por una experiencia de sesión completa:

- navegación `Inicio / Descenso / Sesión / Retorno / Biblioteca / ATLAS`;
- perfil de sesión e intención;
- cuatro dimensiones del método alquímico:
  - Inframundo,
  - Activación,
  - Disociación,
  - Apertura;
- mandala/toroide central animado;
- eje visual `Descenso → Sesión → Retorno`;
- campo bilateral y gradiente de retorno;
- frecuencias simbólicas seleccionables;
- motor Web Audio;
- temporizador;
- observaciones locales;
- guardado local;
- exportación de sesión a JSON ATLAS;
- sincronización opcional con Ars-Caeli-Cannonical.

## Frontera epistemológica

Se preservan tres capas explícitas:

1. **Canon:** documentos Markdown/JSON del repositorio.
2. **Operacionalización experimental:** cómo la UI convierte variables internas en parámetros de visualización y audio.
3. **Correspondencia simbólica:** asociaciones de frecuencia propias de Ars Caeli.

Las asociaciones de frecuencia **no se presentan como hechos médicos, neurofisiológicos ni terapéuticos**.

## Archivos

```text
sound-field-v0.3/
├── index.html
├── styles.css
├── app.js
├── mappings.json
├── module.manifest.json
├── README.md
└── data/
    └── metodo_alquimico_base.json
```

## Uso local

Servir por HTTP:

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000`.

## GitHub Pages

Puedes publicar esta carpeta como reemplazo del MVP anterior.  
Si quieres mantener la URL existente, copia su contenido dentro de la ruta actual de `sound-field-mvp/`.

## ATLAS

`Exportar a ATLAS` genera un JSON con:

- identificación de sesión,
- motor y versión,
- duración real,
- fase,
- intención,
- constructo activo,
- dimensiones,
- gradiente,
- coherencia operativa,
- frecuencia simbólica seleccionada,
- parámetros del campo,
- observaciones,
- seguridad.

ATLAS registra memoria. No decide causalidad.
