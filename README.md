# Ars Caeli — Corpus Canónico

**Versión del contenedor:** 0.1.0  
**Estado:** Experimental  
**Fuente de verdad prevista:** repositorio Git  

Este contenedor reúne y ordena los paquetes fundacionales de Ars Caeli.

## Estructura

```text
ArsCaeli/
├── 00_KERNEL/          Reglas nucleares, axiomas y soporte
├── 01_LANGUAGE/        Aletheia Percepta Language (APL)
├── 02_FOUNDATION/      Constitución, epistemología, ontología y manifiesto
├── 03_INFRASTRUCTURE/  Metamodelo, esquemas, grafos y registros
├── 04_PHYSICS/         Física Cognitiva
├── 05_BIOLOGY/         Reservado
├── 06_PSYCHOLOGY/      Reservado
├── 07_ALCHEMY/         Reservado
├── 08_ENGINES/         Reservado para AEON, Noogenesis y otros motores
├── 09_ATLAS/           Modelo de memoria y Biofeedback
├── 10_EXPERIMENTS/     Experimentos ACX y observaciones ACO
├── 11_DATA/            Reservado para datasets
├── 12_REFERENCE/       Roadmap, plantillas y notas de procedencia
└── registry/           Registro maestro, manifiesto y migración
```

## Inicio recomendado

1. Leer `02_FOUNDATION/ACSPEC-000-CONSTITUTION.md`.
2. Leer `01_LANGUAGE/APL/README.md`.
3. Consultar `03_INFRASTRUCTURE/specs/ACSPEC-008-METAMODEL.md`.
4. Registrar futuras sesiones con `09_ATLAS/templates/SESSION_TEMPLATE.md`.
5. Guardar experimentos en `10_EXPERIMENTS/experiments/`.
6. Guardar observaciones en `10_EXPERIMENTS/observations/`.

## Regla canónica

Los archivos Markdown y JSON de este repositorio son la fuente documental. Las aplicaciones, agentes y bases de datos deben consumirlos o sincronizarse con ellos, no sustituirlos silenciosamente.
