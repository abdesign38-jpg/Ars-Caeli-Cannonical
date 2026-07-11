# ACSPEC-008 — Metamodelo de Ars Caeli

```yaml
id: ACSPEC-008
title: Metamodelo de Ars Caeli
version: 0.1.0
status: experimental
layer: foundation
owner: Ars Caeli
depends_on:
  - ACSPEC-002
  - ACSPEC-004
related:
  - ACSPEC-010
  - ACSPEC-011
```

## 1. Propósito

El metamodelo define qué entidades existen, cómo se relacionan y cómo circula la información en Ars Caeli.

## 2. Entidades nucleares

| Prefijo | Entidad | Función |
|---|---|---|
| APC | Concepto | Define una unidad ontológica |
| ACP | Parámetro | Variable controlable o medible |
| ACR | Relación | Conecta entidades |
| ACS | Estado | Configuración dinámica |
| ACE | Motor | Ejecuta procesos |
| ACH | Hipótesis | Formula una predicción |
| ACX | Experimento | Diseña una prueba |
| ACO | Observación | Registra experiencia o medición |
| ACM | Métrica | Define cómo medir |
| ACK | Conocimiento | Consolida hallazgos |
| ACSYN | Símbolo | Representa un modelo simbólico |
| ACORG | Organismo | Evento generativo de AEON |

## 3. Jerarquía mínima

```text
Sistema
└── Subsistema
    └── Constructo
        └── Entidad
            └── Variable
                └── Valor
```

## 4. Flujo epistemológico

```text
ACE-AEON
  generates
ACX-Experiment
  produces
ACO-Observation
  recorded_by
ACE-BIOFEEDBACK
  stored_in
ACE-MNEMOSYNE
  detects
ACR-Pattern
  informs
ACH-Hypothesis
  coordinated_by
ACE-NOOGENESIS
  updates
ACE-AEON
  contributes_to
ACK-Knowledge
  consolidated_in
ACE-ATLAS
```

## 5. Cardinalidades mínimas

- Un motor puede ejecutar muchos experimentos.
- Un experimento puede producir muchas observaciones.
- Una observación pertenece a un experimento.
- Una hipótesis puede usar muchas observaciones.
- Una observación puede apoyar o contradecir muchas hipótesis.
- Un conocimiento consolidado requiere múltiples evidencias.
- Un símbolo puede relacionarse con muchos conceptos sin reemplazarlos.

## 6. Capas

- `universal`
- `individual`
- `symbolic`

Todo cambio entre capas debe declararse explícitamente.

## 7. Restricciones

1. Una observación no puede declararse conocimiento.
2. Un símbolo no puede modificar directamente un dato observado.
3. Una hipótesis debe tener criterio de refutación.
4. Un conocimiento debe conservar la evidencia contradictoria.
5. Una entidad deprecada no se elimina.

## 8. Unidad operativa

La unidad mínima de Ars Caeli no es el documento, sino la entidad trazable.

## 9. Meta

Permitir que ATLAS construya un grafo navegable donde cada afirmación conserve identidad, origen, relaciones, madurez y evidencia.
