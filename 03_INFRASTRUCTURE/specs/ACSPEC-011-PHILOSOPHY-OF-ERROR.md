# ACSPEC-011 — Filosofía del Error

## Principio central

En Ars Caeli, el error no es basura. Es información sobre el límite del modelo.

## 1. Tipos de error

### Error de implementación
El motor no ejecutó lo especificado.

### Error de medición
La métrica no capturó correctamente la experiencia.

### Error de interpretación
Se confundió observación con significado.

### Error de clasificación
La entidad fue ubicada en una capa o tipo incorrecto.

### Error de hipótesis
La predicción no se sostuvo.

### Error de contexto
Variables externas alteraron la sesión.

### Error de lenguaje
APL no pudo representar el fenómeno con suficiente precisión.

## 2. Regla de conservación del error

Todo error relevante debe registrarse como entidad o incidencia trazable.

## 3. Estados posibles

- `open`
- `investigating`
- `resolved`
- `accepted_limitation`
- `reclassified`
- `deprecated_assumption`

## 4. Anomalías

Las observaciones minoritarias no se eliminan. Se clasifican como anomalías y pueden originar nuevas hipótesis.

## 5. Hipótesis refutada

Una hipótesis refutada:

- no se borra;
- cambia a `rejected` o `deprecated`;
- conserva evidencia;
- registra qué aprendió el sistema.

## 6. Regla de humildad

La ausencia de explicación no debe rellenarse con certeza simbólica ni con falsa precisión técnica.

## 7. Objetivo

Construir un sistema que pueda equivocarse sin desintegrarse.
