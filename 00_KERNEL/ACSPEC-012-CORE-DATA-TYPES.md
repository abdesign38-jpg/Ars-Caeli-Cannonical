# ACSPEC-012 — Core Data Types

## Tipos primitivos

| Tipo | Uso |
|---|---|
| `string` | texto |
| `integer` | número entero |
| `float` | número decimal |
| `boolean` | verdadero/falso |
| `enum` | valor dentro de un catálogo |
| `timestamp` | fecha y hora |
| `date` | fecha |
| `duration` | intervalo temporal |
| `probability` | valor 0..1 |
| `range` | mínimo/máximo |
| `reference` | ID de otra entidad |
| `vector` | lista ordenada de valores |
| `object` | estructura compuesta |
| `null` | dato desconocido o ausente |

## Reglas

1. `null` significa desconocido, no cero.
2. Toda probabilidad usa rango 0..1.
3. Toda duración debe declarar unidad.
4. Toda referencia debe apuntar a un ID válido.
5. Los rangos deben declarar límites inclusivos o exclusivos.
