# ACSPEC-017 — Semantic Versioning

Formato:

```text
MAJOR.MINOR.PATCH
```

## MAJOR

Cambios incompatibles.

## MINOR

Nuevas capacidades compatibles.

## PATCH

Correcciones sin cambio conceptual mayor.

## Estados

- `draft`
- `experimental`
- `stable`
- `deprecated`
- `rejected`
- `archived`

## Reglas

Cada actualización debe declarar:

```yaml
supersedes:
compatible_with:
breaking_changes:
```

Una entidad deprecada no se elimina.
