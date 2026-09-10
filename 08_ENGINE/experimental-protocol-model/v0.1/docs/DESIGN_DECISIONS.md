# Design Decisions — Experimental Protocol Model v0.1

## 1. Por qué existe CRYSTALLIZATION_PROFILE
El Método Alquímico Base ya posee cristalizaciones simbólicas nombradas y estructuradas. Para experimentar necesitamos impedir que una métrica calculada termine usurpando ese significado.

Se establecen dos namespaces:
- `source_model`
- `response_crystallization`

No son equivalentes.

## 2. Por qué Pilot 01 no usa 174 Hz
Invisibilidad Relacional contiene 174 Hz como correspondencia simbólica de herida, pero Pilot 01 no intenta validar esa relación.

Primero prueba una pregunta anterior:
¿podemos manipular Vacío de manera reproducible y observar una respuesta repetible?

Se usa una señal constante del Método Base para evitar introducir carrier como segunda variable experimental.

## 3. Por qué Vacío no es delay
ACSPEC-101 define Vacío como baja información, no como eco.

Un delay puede incrementar información/persistencia. Por eso el piloto usa ocupación temporal explícita: señal activa vs silencio.

## 4. Por qué Entropía está fija
Vacío y Entropía son constructos distintos.

Pilot 01 utiliza ciclos periódicos fijos, sin jitter. Si más adelante se manipula Entropía, se hará en un experimento factorial separado.

## 5. Por qué la herida permanece oculta
El perfil de Invisibilidad Relacional contiene predicciones simbólicas sobre presencia, espacio, vínculo y cuerpo.

Mostrar esas predicciones antes del reporte contaminaría la observación.

## 6. Por qué el outcome primario es uno
Se predeclara `felt_presence`.

Las demás escalas son secundarias. Esto reduce la tentación de escoger después la variable que “salió bonita”.

## 7. Por qué LOW→MEDIUM→HIGH→MEDIUM→LOW
Permite una primera medición de dependencia de trayectoria al repetir niveles.

No prueba histéresis de forma concluyente porque también puede existir efecto de orden. Por eso se exige replicación y, en fase posterior, contrabalanceo.

## 8. Qué significa resultado nulo
Un resultado nulo no es fracaso del sistema.

Si el cambio es pequeño, inconsistente o desaparece al contrabalancear, la operacionalización de Vacío no queda apoyada para ese outcome y debe revisarse.

Ese resultado debe conservarse en ATLAS.
