# Plantillas APL

## Plantilla de concepto

```apl
CONCEPT APC-XXXX
TITLE ""
LAYER universal|individual|symbolic
STATUS seed
DEFINITION ""
BOUNDARIES ""
RELATED []
END
```

## Plantilla de parámetro

```apl
PARAMETER ACP-XXXX
TITLE ""
TYPE continuous|discrete|categorical
RANGE ""
DEFAULT ""
UNIT ""
LAYER ""
GENERATED_BY ""
OBSERVED_BY []
HYPOTHESIS []
END
```

## Plantilla de relación

```apl
RELATION ACR-XXXX
FROM ""
TO ""
OPERATOR may_increase|may_decrease|correlates_with|modulates
CONDITION ""
CONFIDENCE unknown
EVIDENCE []
END
```

## Plantilla de experimento

```apl
EXPERIMENT ACX-XXXX
ENGINE ACE-AEON@x.y.z
DURATION ""
PARAMETERS {}
CONTEXT {}
SAFETY {}
END
```

## Plantilla de observación

```apl
OBSERVATION ACO-XXXX
EXPERIMENT ACX-XXXX
TYPE subjective|objective
TIME_REAL ""
TIME_PERCEIVED ""
BODY []
IMAGES ""
RESPIRATION ""
AFFECT ""
INTERPRETATION ""
END
```

## Plantilla de conocimiento

```apl
KNOWLEDGE ACK-XXXX
TITLE ""
SUPPORTED_BY []
STATUS provisional|consolidated
LIMITATIONS []
VERSION 0.1.0
END
```
