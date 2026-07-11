# Modelo de Entidades APL

## Prefijos oficiales

| Prefijo | Entidad | Propósito |
|---|---|---|
| `APC` | Concepto | Define una entidad ontológica |
| `ACP` | Parámetro | Variable controlable o medible |
| `ACR` | Relación | Conecta entidades |
| `ACS` | Estado | Configuración dinámica |
| `ACE` | Motor | Sistema ejecutor |
| `ACH` | Hipótesis | Predicción provisional |
| `ACX` | Experimento | Diseño de prueba |
| `ACO` | Observación | Registro literal |
| `ACM` | Métrica | Instrumento de medición |
| `ACK` | Conocimiento | Hallazgo consolidado |
| `ACSYN` | Símbolo | Modelo simbólico |
| `ACORG` | Organismo | Evento generativo dentro de AEON |

## Metadatos obligatorios

```yaml
id: ACP-002
title: Densidad del Vacío
version: 0.1.0
status: experimental
layer: universal
maturity: operationalized
owner: Ars Caeli
created: 2026-07-10
updated: 2026-07-10
```

## Reglas de identidad

1. Un identificador nunca se reutiliza.
2. El nombre puede cambiar; el identificador no.
3. Una entidad obsoleta permanece documentada.
4. Toda entidad debe declarar su capa.
5. Toda entidad debe enlazar dependencias y relaciones relevantes.
