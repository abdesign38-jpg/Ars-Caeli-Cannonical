# ATLAS-001 — Modelo de Sesión

## Unidad de memoria

La unidad mínima de ATLAS es una **sesión trazable**.

Una sesión vincula:

```text
Participante anonimizado
+ Contexto
+ Motor y versión
+ Parámetros
+ Protocolo
+ Observaciones
+ Interpretaciones
+ Incidencias
+ Hipótesis relacionadas
```

## Secciones obligatorias

### 1. Identidad

- `session_id`
- `experiment_id`
- `participant_id`
- `engine`
- `engine_version`
- `date`
- `duration_real`

### 2. Contexto

- dispositivo;
- audífonos;
- ruido ambiental;
- postura;
- hora;
- sueño;
- cafeína;
- hidratación;
- estado emocional previo;
- sensibilidad autodeclarada.

### 3. Parámetros

Cada parámetro debe usar un identificador ACP estable.

### 4. Observación

Debe registrar literalmente:

- tiempo percibido;
- sensaciones corporales;
- respiración;
- emoción;
- imágenes;
- movimiento;
- claridad;
- comodidad;
- interrupciones.

### 5. Interpretación

Se separa en:

- experimental;
- simbólica;
- sin interpretación.

### 6. Seguridad

- eventos adversos;
- motivo de interrupción;
- recuperación;
- recomendaciones posteriores.

## Regla

Una sesión nunca debe contener una conclusión causal.
