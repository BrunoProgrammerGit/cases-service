# Modelo de dominio de casos

## Coordenadas y tablero

`x` aumenta hacia el este y `y` hacia el sur. El origen interno es `(0, 0)` en
la esquina superior izquierda. La presentación numerada traduce la fila visible
`R1` a `y=0` y la columna `C1` a `x=0`: `y = numeroFila - 1` y
`x = numeroColumna - 1`. Las dimensiones `rows` y `columns` son variables; cada
caso administrado debe incluir exactamente una celda para cada coordenada del
rectángulo. La convención existente de posiciones `(x,y)` no cambia.

## Habitaciones, celdas, objetos y paredes

Cada celda ROOM puede incluir un `roomId` estable. Las celdas del mismo ID
forman una habitación irregular conectada por lados. Para documentos antiguos
sin `roomId`, el servicio usa `name` de celdas ROOM como grupo legado; por eso
no se requiere migración y nombres antiguos distintos continúan designando
grupos separados. No existe capacidad máxima: cualquier cantidad de personajes
puede estar en una habitación si ocupan celdas distintas.

`objects` es opcional y contiene objetos tipados con ID, tipo estable y una o
varias coordenadas; esa lista de coordenadas es la única asociación objeto-celda
y permite consultar los objetos de una celda sin duplicar referencias. La
ocupabilidad sigue siendo propiedad de la celda y autoritativa; un objeto no la
cambia ni se supone que bloquee. Las celdas antiguas `FIXED_OBJECT` siguen
aceptándose aunque no tengan entrada en `objects`.

`walls` representa bordes entre celdas, no casillas. Un borde se expresa como
`{ "x": 0, "y": 0, "side": "EAST" }`; para evitar duplicidad, represente cada
borde una sola vez. El servicio reconoce también orientaciones opuestas y
rechaza el mismo borde repetido (por ejemplo `EAST` de una celda y `WEST` de la
vecina). Los bordes deben separar dos celdas existentes. No se derivan paredes
automáticamente de `roomId`, `name` u `occupable`.

```json
{
  "rows": 2,
  "columns": 3,
  "cells": [
    {"x":0,"y":0,"occupable":true,"type":"ROOM","name":"Sala","roomId":"room-a"},
    {"x":1,"y":0,"occupable":true,"type":"ROOM","name":"Sala","roomId":"room-a"},
    {"x":2,"y":0,"occupable":true,"type":"ROOM","name":"Sala","roomId":"room-a"},
    {"x":0,"y":1,"occupable":true,"type":"ROOM","name":"Sala","roomId":"room-a"},
    {"x":1,"y":1,"occupable":false,"type":"EMPTY"},
    {"x":2,"y":1,"occupable":true,"type":"ROOM","name":"Sala","roomId":"room-a"}
  ],
  "objects": [
    {"id":"chair-1","type":"CHAIR","cells":[{"x":0,"y":0}]}
  ],
  "walls": [{"x":1,"y":0,"side":"SOUTH"}],
  "clues": [
    {"id":"clue-global","text":"...","scope":"GENERAL"},
    {"id":"clue-person","text":"...","scope":"CHARACTER","characterId":"S1"}
  ]
}
```

El fragmento es ilustrativo: cada caso real necesita una solución coherente,
personajes, y todas las celdas del rectángulo. El cuarto `clues` en formato
antiguo `{id,text}` sigue permitido. `hints` conserva su recurso independiente
por niveles y no se mezcla con las pistas.

## Reglas del dominio

- Dos celdas están «junto a» cuando comparten un lado:
  `abs(x1 - x2) + abs(y1 - y2) == 1`. Las diagonales no cuentan. Es definición
  para futuras comprobaciones narrativas; el servicio no interpreta pistas.
- Un personaje está solo si es el único personaje colocado en una habitación,
  comparando `roomId`; para registros ROOM antiguos sin ID, se usa `name` como
  fallback de compatibilidad. Los casos nuevos no deben depender del nombre.
  El tamaño de la habitación no afecta esta definición. No se evalúa aún como
  regla narrativa.
- La solución almacenada permanece privada. El cliente no determina si una
  solución es correcta: el servicio compara todas las posiciones con la solución
  privada y solo devuelve `killerFound` al acertar.
- Cada personaje debe aparecer una vez en la solución, en una celda existente y
  ocupable. Dos personajes no comparten una celda. La API de validación rechaza
  IDs de personaje repetidos en la petición.

## Recursos visuales

Los campos opcionales son los definidos por el contrato visual existente:
`visuals.backgroundId`, `visuals.floorId`, `cells[].visual.floorId`,
`cells[].visual.obstacleId` y `characters[].visualId`. El servicio los valida
como IDs, no como rutas ni bytes, y los copia en la respuesta de detalle. Los
campos son opcionales y no cambian la ocupabilidad. No se incluyen `solution` ni
`hints` en la respuesta pública de detalle.
