# GitHub Coder Integration Brief — Experimental Protocol Model v0.1

## Objetivo
Integrar primero la capa contractual. No rediseñar AEON ni reinterpretar los contratos durante este commit.

## Fase A — contratos
Ubicar en:

`08_ENGINE/experimental-protocol-model/v0.1/`

Añadir un validador capaz de:
- cargar schemas;
- validar instancias;
- devolver errores estructurados;
- impedir ejecución si un `STIMULUS_CONDITION` es inválido.

No cambiar todavía Sound Field.

## Fase B — adapters puros

Crear:
- `loadWoundProfile(id)`
- `loadCrystallizationProfile(id)`
- `loadVoidProfile(id)`
- `loadStimulusCondition(id)`
- `loadProbeSet(id)`
- `createResponseSeries(sessionContext)`

Un adapter no puede convertir un campo `source_symbolic` en `engine_measured` o `participant_reported`.

## Fase C — motor determinista de Vacío

Para Pilot 01, Vacío NO es delay.

Vacío = ocupación temporal.

Implementar un gate/envelope de amplitud según el calendario `active_duration_s / silent_duration_s`.

Requisitos:
- el schedule deriva del tiempo transcurrido de sesión;
- Play/Stop/Resume conserva posición determinista;
- bordes con ramp corto anti-click constante entre condiciones;
- no introducir random jitter;
- registrar gate state y métricas del schedule;
- AnalyserNode permanece downstream para observar la salida digital generada.

## Fase D — probes ciegos

La UI debe:
- usar exactamente la misma redacción/escalas en todas las condiciones;
- ocultar herida, órganos, dirección esperada y racional de frecuencia;
- permitir Skip;
- timestamp;
- ligar cada respuesta con `condition_id` y snapshot del motor.

## Fase E — resultados

No crear un composite score general.

Calcular sólo métricas declaradas cuyo `preconditions_met` sea true.

Pilot 01:
- `void_response_slope`
- `hysteresis_delta_medium`
- `hysteresis_delta_low`
- `recovery_time_s`
- `persistence_auc`

Mostrar respuestas crudas antes de interpretación.

## No-goals
- no diagnosis
- no organ inference
- no therapeutic claim
- no automatic wound selection
- no hidden carrier/modulation changes between Void conditions
- no delay/reverb as primary Void manipulation
- no entropy jitter in Pilot 01
- no model reveal before blind observation

## Acceptance checks
- contrato inválido bloquea Run con error legible;
- LOW/MEDIUM/HIGH generan exactamente 20/50/80% scheduled silence por bloque completo de 60 s;
- todas las condiciones conservan ciclo de 10 s y 6 onsets/min;
- carrier = 432 Hz en todo Pilot 01;
- audio modulation = 8 Hz en todo Pilot 01;
- no random jitter;
- probe wording idéntico;
- export separa participant_reported, engine_measured y derived_metric;
- métrica derivada no se calcula sin datos suficientes.
