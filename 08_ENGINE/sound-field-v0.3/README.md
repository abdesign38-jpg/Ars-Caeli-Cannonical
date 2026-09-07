# AEON Sound Field v0.3.1

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
- sincronización opcional con Ars-Caeli-Cannonical;
- sesiones persistentes con observaciones aisladas por sesión;
- registro manual de microvacíos y exportación de eventos a ATLAS.

## Descenso, Retorno y Microvacíos

AEON modela una sesión como una trayectoria y no como un estado fijo.

La presencia puede perder continuidad temporalmente mediante pequeñas discontinuidades operativas llamadas microvacíos.

Un microvacío se registra como evento de sesión:

`Presencia → Microvacío → Reorganización → Presencia`

Los microvacíos de AEON son eventos operativos y simbólicos. No se presentan como mediciones neurológicas o fisiológicas. `Descenso` no es un `Retorno` invertido: la trayectoria de retorno puede diferir estructuralmente de la trayectoria de descenso.

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
- índice de integración,
- frecuencia simbólica seleccionada,
- parámetros del campo,
- observaciones,
- seguridad.

ATLAS registra memoria. No decide causalidad. Los IDs de experimento y participante son editables y no requieren información personal.
