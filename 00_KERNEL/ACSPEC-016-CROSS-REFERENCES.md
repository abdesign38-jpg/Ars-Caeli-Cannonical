# ACSPEC-016 — Cross References

## Relaciones permitidas

- `depends_on`
- `related_to`
- `implements`
- `implemented_by`
- `observed_by`
- `tested_by`
- `derived_from`
- `supersedes`
- `compatible_with`
- `supports`
- `contradicts`
- `symbolizes`
- `must_not_override`

## Reglas

1. Preferir relaciones específicas a `related_to`.
2. Toda referencia debe usar ID, no solo título.
3. Las referencias rotas deben bloquear integración.
4. Las referencias simbólicas nunca sustituyen relaciones experimentales.
