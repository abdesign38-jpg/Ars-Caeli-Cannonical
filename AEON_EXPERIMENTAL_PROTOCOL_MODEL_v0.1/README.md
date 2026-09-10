# AEON Experimental Protocol Model v0.1

Este paquete convierte la metodología Ars Caeli actual en contratos versionados para uso experimental sin confundir material simbólico con medición.

## Contratos

### WOUND_PROFILE
Conserva la herida como hipótesis simbólica versionada:
- nodo emocional
- manifestaciones
- geometría
- frecuencias simbólicas
- modelos matemáticos fuente
- correlatos cristalinos
- mapa dimensional

Añade `observable_candidates` únicamente como `experimental_operationalization`.

### CRYSTALLIZATION_PROFILE
Conserva cristalizaciones fuente como Retención Afectiva, Bucle Mental, Implosión Materna, Rigidez Identitaria y Drenaje Bloqueado.

Separa explícitamente:
- `source_model`
- `experimental_response_construct`

`response_crystallization` significa persistencia/dependencia de trayectoria de una respuesta observada. No equivale a demostrar la cristalización simbólica fuente.

### VOID_PROFILE
Conserva ACSPEC-101 como fuente draft.

Para el piloto, Vacío se operacionaliza como `temporal_occupancy`: proporción entre señal activa y silencio deliberado dentro de un calendario determinista.

Vacío queda separado de:
- delay
- reverb
- entropy

### STIMULUS_CONDITION
Unidad que AEON ejecuta. Declara:
- variable manipulada
- variables mantenidas constantes
- identidad/procedencia de la señal
- perfil de Vacío
- timing
- posición de orden
- blinding
- boundary de medición

### OBSERVATION_PROBE
Instrumento neutral de observación:
- misma redacción entre condiciones
- sin nombre de herida
- sin órgano previsto
- sin dirección esperada
- escalas predefinidas
- posibilidad de omitir respuesta

### RESPONSE_SERIES
Separa:
- `participant_reported`
- `engine_measured`
- `derived_metric`

Las métricas derivadas sólo se calculan cuando se cumplen sus precondiciones.

## Regla epistemológica

`source_symbolic != experimental_operationalization != engine_measured != participant_reported != derived_metric`

Ninguna capa puede convertirse silenciosamente en otra.

## Pilot 01

Archivo:
`examples/pilot-01-void-x-crystallization.protocol.json`

Pregunta primaria:

> ¿Cambiar solamente la densidad temporal de Vacío modifica de forma repetible la presencia sentida, manteniendo constantes carrier, modulación, periodicidad y predictibilidad?

### Vacío temporal

Todos los bloques usan ciclos de 10 segundos y 6 inicios/minuto:

- LOW: 8 s activo + 2 s silencio = 20% silencio
- MEDIUM: 5 s activo + 5 s silencio = 50% silencio
- HIGH: 2 s activo + 8 s silencio = 80% silencio

La entropía temporal queda controlada:
- periodicidad fija
- sin jitter
- predictibilidad = 1
- gap CV = 0

### Secuencia piloto

`LOW → MEDIUM → HIGH → MEDIUM → LOW`

Esto permite una primera lectura de dependencia de trayectoria.

No basta por sí solo para separar histéresis de efectos de orden, por lo que el protocolo exige replicación y luego contrabalanceo.

### Outcome primario

`felt_presence`, escala 0–10.

Se deriva experimentalmente de la manifestación fuente de Invisibilidad Relacional que describe desconexión con el entorno y con la propia presencia.

El participante no ve la etiqueta de la herida ni la dirección esperada antes del registro.

### Métricas de response crystallization

- `void_response_slope`
- `hysteresis_delta_medium`
- `hysteresis_delta_low`
- `recovery_time_s`
- `persistence_auc`

Estas métricas describen la serie observada. No diagnostican Retención Afectiva ni prueban una cristalización simbólica.

## Ubicación sugerida en repositorio

```text
08_ENGINE/
  experimental-protocol-model/
    v0.1/
      contracts/
      examples/
      docs/
```

## Orden recomendado de implementación

1. Integrar contratos sin cambiar el audio actual.
2. Añadir validación de contratos.
3. Implementar gating determinista de Vacío.
4. Añadir probes ciegos.
5. Ejecutar Pilot 01 como calibración interna.
6. Inspeccionar series crudas.
7. Sólo después diseñar Pilot 02 para comparar carriers simbólicos de herida.
