# Gramática de APL

APL puede escribirse en bloques de texto estructurado.

## 1. Concepto

```apl
CONCEPT APC-001
TITLE "Vacío"
LAYER universal
STATUS experimental
DEFINITION "Estructura de baja información; no ausencia absoluta."
RELATED ACP-002, APC-004
END
```

## 2. Parámetro

```apl
PARAMETER ACP-002
TITLE "Densidad del Vacío"
TYPE continuous
RANGE 0..1
DEFAULT 0.45
UNIT normalized
LAYER universal
GENERATED_BY ACE-AEON
OBSERVED_BY ACM-TIME, ACM-IMMERSION
HYPOTHESIS ACH-002
END
```

## 3. Relación

```apl
RELATION ACR-001
FROM ACP-002
TO ACS-003
OPERATOR may_increase
CONDITION "ACP-005 >= 0.50"
CONFIDENCE unknown
STATUS experimental
END
```

## 4. Estado

```apl
STATE ACS-003
TITLE "Suspensión"
ACTIVATES ACP-002, ACP-007, ACP-008
DEACTIVATES ACP-003
ENTRY "latencia alta y continuidad reducida"
EXIT "marcador de retorno"
END
```

## 5. Hipótesis

```apl
HYPOTHESIS ACH-004
IF ACP-002 > 0.65
AND ACP-005 > 0.50
THEN ACS-003
EXPECTED "mayor suspensión temporal"
CONFIDENCE unknown
STATUS experimental
END
```

## 6. Experimento

```apl
EXPERIMENT ACX-0028
ENGINE ACE-AEON@0.6.0
DURATION 240s
STATE ACS-003
PARAMETERS {
  ACP-001 = 0.72
  ACP-002 = 0.68
  ACP-007 = 0.54
}
CONTEXT {
  sleep = "7h"
  caffeine = "none"
  room_noise = "low"
}
END
```

## 7. Observación

```apl
OBSERVATION ACO-0184
EXPERIMENT ACX-0028
TYPE subjective
TIME_REAL 4m
TIME_PERCEIVED 27m
BODY ["occipital", "hands"]
IMAGES "repetitive"
RESPIRATION "irregular at beginning"
AFFECT "calm"
INTERPRETATION "none"
END
```

## 8. Símbolo

```apl
SYMBOL ACSYN-003
TITLE "Universo Reverso"
LAYER symbolic
DEFINITION "Modelo de inversión de relaciones perceptivas."
MUST_NOT_OVERRIDE observation
END
```

## Reglas sintácticas

- Cada bloque inicia con un tipo y un identificador.
- Cada bloque termina con `END`.
- Los identificadores se escriben sin espacios.
- Las cadenas libres se escriben entre comillas.
- Los campos múltiples usan listas o bloques.
- La incertidumbre debe declararse.
