# Long Road — Residence

Interactive room plan of the house: both levels, every measured size, a 3D model, and the scan photos.
Built for the interior designer — nothing here needs to be installed, it is a static page.

**Open it:** https://burjui90.github.io/long-road-residence/

## What the page does

| Control | What it gives you |
|---|---|
| **LEVEL 1 / LEVEL 2** | the two floors |
| **PLAN / 3D / DATA** | the drawing · an orbitable model with real ceiling heights · every figure in one table |
| **ALL SIZES / SELECTED / NO SIZES** | how much dimensioning sits on the drawing |
| **FT / M** | feet-and-inches or metres — both are shown everywhere |
| **EN / RU** | interface and room names |

Click a room on the drawing (or a row in the table) and the right-hand panel gives its area,
perimeter, volume, ceiling height, wall/door/window counts, the wall run in order, and the photos.
In 3D, drag to orbit and use the wheel to zoom.

## Where the numbers come from

Room scans of **6 August 2026**, one file per room, plus the owner's own figures where no scan exists.
Every polygon on this site reproduces its scan's reported area to two decimals — that check is what the
geometry was built against.

Rooms are marked by how solid the figure is, and the drawing shows it:

- **solid black wall — scanned.** The scan carries an overview table: area, perimeter, volume,
  ceiling height, and counts of walls, doors and windows.
- **amber dashed — outline only.** The scan exists but has no overview table, so the area comes from
  the traced outline and there is no second source for it.
- **red dashed — owner figure.** Not scanned at all. Drawn from the owner's mark-up or stated dimensions.

### Level 1 — 1,387.5 ft² across nine sections

| # | Room | Area | Ceiling | Source |
|---|---|---|---|---|
| 01 | Living room | 243.96 ft² / 22.66 m² | 10'6.97" at the peak, 6'1.23" at the low side | File 5, scanned |
| 02 | Dining room | 252.84 ft² / 23.49 m² | 8'1.11" | File 6, scanned |
| 03 | Kitchen | 285.40 ft² / 26.51 m² | **never measured** | File 7, outline only |
| 04 | Living room 2 | 179.54 ft² / 16.68 m² | 9'0" owner | File 8, outline only |
| 05 | Corridor | 63.96 ft² / 5.94 m² | 8'0" owner | File 9, outline only |
| 06 | Bathroom | 41.41 ft² / 3.85 m² | 7'11.67" | File 11, scanned |
| 07 | Laundry | 60.08 ft² / 5.58 m² | 8'0.51" | File 10, scanned |
| 08 | Entry space | 146.15 ft² / 13.58 m² | 17'0" open, 8'0" over the leg | owner mark-up |
| 09 | Study | 114.16 ft² / 10.61 m² | **never measured** | File 12, outline only |

### Level 2 — 752.60 ft² scanned across five of eight sections

| # | Room | Area | Ceiling | Source |
|---|---|---|---|---|
| 01 | Bedroom 1 | 132.38 ft² / 12.30 m² | 7'0" at the wall, centre never measured | Doc 16, scanned |
| 02 | Restroom | 55.98 ft² / 5.20 m² | 8'0" owner | Doc 18, scanned |
| 03 | Kid room 2 | 151.62 ft² / 14.09 m² | 8'0.85" | Doc 19, scanned |
| 04 | Master bedroom | 288.18 ft² / 26.77 m² | 7'2.01" at the wall, 8'0" in the tray | Doc 20, scanned |
| 05 | Master bath | 124.44 ft² / 11.56 m² | 8'0.61" | Doc 21, scanned |
| 06 | Stair | ~24.8 ft² | open to Level 1 | owner mark |
| 07 | Attic room | 660.00 ft² floor | 1'0" at the eaves, 8'0" at the ridge | owner |
| 08 | Corridor | **no area — width never measured** | 8'0" owner | owner |

The master bath also has a toilet closet of 17.86 ft², which is why the sheets quote 770.46 ft² for
Level 2 rather than 752.60.

## Two things to read before designing against this

**The attic's 660 ft² of floor is not 660 ft² of room.** Eaves at 1'0", ridge at 8'0", span 22 ft — a
32.5 degree pitch. Standing height (6'8" or more) covers 126 ft², about 19 per cent of the floor.

**The laundry scan is labelled "Kitchen" inside the app that produced it.** That is the app's room
label, not the room. Its area, 60.08 ft² on File 10, is the laundry. The real kitchen is File 7.

## Still missing

1. **Kitchen and study ceilings** — never measured in either room.
2. **Opening W, kitchen ↔ living room 2** — 3'6.53" on one side against the other side's figure.
   The only thing on Level 1 that does not close.
3. **The stair** — width across the flight, run direction, tread count, and the size of the opening it
   makes in the Level 2 floor. Until that exists the two levels cannot be aligned to each other, so the
   two plans here are each correct on their own and are not positioned relative to one another.
4. **Level 2 corridor width** — one measurement across it would give the corridor an area.
5. **Bedroom 1 ceiling in the centre** — tray or slope.
6. **Door G in the master bedroom** — still has no known destination.

## Layout

```
index.html              the page
assets/css/app.css
assets/js/data.js       every room: polygon, areas, ceilings, photo list
assets/js/app.js        plan, 3D and table rendering
assets/photos/          45 scan photos
sheets/full-sheet.html  the earlier single-file sheet, kept for reference
source/                 the originals: room-scan PDFs, DXF, plan PNGs, plan set PDF
```

`source/` holds the raw material — the seven Level 1 room-scan PDFs, the two DXF files (Level 1 in
inches, Level 2 in quarter-inches), and the drawn plan sheets. Bring those into CAD directly.

## Editing it

There is no build step. Edit the files and reload. Room figures live in one place,
`assets/js/data.js`; polygon coordinates there are **inches**, y increasing downward, matching the
survey sheets.
