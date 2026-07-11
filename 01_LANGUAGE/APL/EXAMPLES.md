# Ejemplos APL

## Ejemplo 1 — Definir una variable

```apl
PARAMETER ACP-007
TITLE "Latencia Cognitiva"
TYPE continuous
RANGE 0..1
DEFAULT 0.50
UNIT normalized
LAYER universal
DEFINITION "Tiempo relativo hasta que una interpretación se estabiliza."
IMPLEMENTED_AS "intervalos variables y ruptura de patrones"
MEASURED_BY ACM-007
END
```

## Ejemplo 2 — Registrar una sesión

```apl
EXPERIMENT ACX-0001
ENGINE ACE-AEON@0.2.0
DURATION 240s
PARTICIPANT anonymous-001
PARAMETERS {
  ACP-001 = 0.08
  ACP-002 = 0.45
  ACP-003 = 0.55
  ACP-009 = 0.35
}
CONTEXT {
  headphones = true
  environment_noise = "low"
  emotional_state = "creative"
}
SAFETY {
  stop_on = ["pain", "panic", "vertigo", "disorientation"]
}
END
```

## Ejemplo 3 — Separar observación e interpretación

```apl
OBSERVATION ACO-0001
EXPERIMENT ACX-0001
OBSERVED {
  time_perceived = "approximately 30m"
  time_real = "4m"
  bodily_sensation = ["hands: density", "lips: mild tremor"]
  imagery = "repetitive"
  affect = "calm"
}
INTERPRETATION {
  symbolic = "possible affinity with Universo Reverso"
  experimental = "possible temporal suspension"
}
END
```

## Ejemplo 4 — Crear hipótesis

```apl
HYPOTHESIS ACH-0001
TITLE "Vacío y suspensión"
IF ACP-002 increases
AND ACP-005 is medium
THEN ACS-003 may_increase
EVIDENCE [ACO-0001]
CONFIDENCE weak
FALSIFIED_BY "no temporal distortion across comparable sessions"
END
```
