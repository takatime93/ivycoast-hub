# Soap Formulator — Rebuild Spec

## Core Feature: Saponification Calculator

The formulator calculates lye (NaOH) amounts, water amounts, and soap bar properties from a recipe of oils/butters.

### Calculation Formulas

**Lye (NaOH) calculation:**
```
For each oil in recipe:
  oilLyeNeeded = oilWeight × oil.sapNaOH

totalLyeNeeded = sum of all oilLyeNeeded
actualLye = totalLyeNeeded × (1 - superfat/100)
```

**Water calculation:**
```
waterWeight = actualLye × (100 - lyeConcentration) / lyeConcentration
```
Default lye concentration: 33%

**Soap properties (weighted average by oil percentage):**
```
For each property (hardness, cleansing, conditioning, bubbly, creamy, iodine, INS):
  propertyValue = sum of (oil.percentage × oil.propertyValue) / 100

Where:
  hardness  = palmitic + stearic
  cleansing = lauric + myristic + ricinoleic (partial)
  conditioning = oleic + linoleic + linolenic + ricinoleic (partial)
  bubbly = lauric + myristic + ricinoleic (partial)
  creamy = palmitic + stearic + ricinoleic (partial)
  iodine = from oil database
  INS = from oil database
```

**Ideal ranges:**
- Hardness: 29-54
- Cleansing: 12-22
- Conditioning: 44-69
- Bubbly: 14-46
- Creamy: 16-48
- Iodine: 41-70
- INS: 136-165

**Quality score:**
```
score = 100 - (penalty for each property outside ideal range)
```

### Oil/Butter Database (18 entries)

| Name | SAP NaOH | SAP KOH | Lauric | Myristic | Palmitic | Stearic | Ricinoleic | Oleic | Linoleic | Linolenic | Iodine | INS | Category | Cost/oz |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Olive Oil | .1353 | .19 | 0 | 0 | 11 | 4 | 0 | 72 | 10 | 1 | 85 | 105 | base | $0.50 |
| Coconut Oil (76°) | .191 | .268 | 48 | 19 | 9 | 3 | 0 | 8 | 2 | 0 | 10 | 258 | base | $0.25 |
| Palm Oil | .1441 | .2024 | 0 | 1 | 44 | 5 | 0 | 39 | 10 | 0 | 53 | 145 | base | $0.20 |
| Castor Oil | .1286 | .1806 | 0 | 0 | 0 | 1 | 90 | 4 | 4 | 0 | 86 | 95 | specialty | $0.35 |
| Sweet Almond Oil | .136 | .191 | 0 | 0 | 7 | 2 | 0 | 71 | 18 | 0 | 99 | 97 | luxury | $0.75 |
| Avocado Oil | .1339 | .1879 | 0 | 0 | 20 | 2 | 0 | 58 | 12 | 0 | 86 | 99 | luxury | $0.90 |
| Sunflower Oil | .136 | .191 | 0 | 0 | 6 | 4 | 0 | 19 | 68 | 1 | 133 | 63 | base | $0.20 |
| Jojoba Oil | .0695 | .0976 | 0 | 0 | 0 | 0 | 0 | 12 | 0 | 0 | 83 | 11 | luxury | $1.50 |
| Hemp Seed Oil | .1357 | .1905 | 0 | 0 | 6 | 2 | 0 | 12 | 57 | 21 | 165 | 39 | specialty | $0.85 |
| Rice Bran Oil | .1284 | .1803 | 0 | 0 | 17 | 2 | 0 | 47 | 33 | 1 | 103 | 70 | base | $0.30 |
| Babassu Oil | .175 | .2457 | 50 | 20 | 11 | 4 | 0 | 10 | 2 | 0 | 15 | 230 | specialty | $0.90 |
| Apricot Kernel Oil | .135 | .1895 | 0 | 0 | 6 | 1 | 0 | 66 | 25 | 0 | 100 | 91 | luxury | $1.00 |
| Grapeseed Oil | .1265 | .1776 | 0 | 0 | 7 | 4 | 0 | 19 | 69 | 0 | 131 | 66 | luxury | $0.65 |
| Kukui Nut Oil | .135 | .1895 | 0 | 0 | 7 | 2 | 0 | 25 | 40 | 25 | 164 | 24 | luxury | $1.80 |
| Palm Kernel Oil | .178 | .2499 | 48 | 16 | 8 | 3 | 0 | 15 | 2 | 0 | 18 | 227 | base | $0.22 |
| Shea Butter | .1282 | .18 | 0 | 0 | 4 | 40 | 0 | 48 | 6 | 0 | 59 | 116 | butter | $0.60 |
| Cocoa Butter | .1378 | .1935 | 0 | 0 | 26 | 34 | 0 | 35 | 3 | 0 | 37 | 157 | butter | $0.80 |
| Mango Butter | .1371 | .1925 | 0 | 0 | 9 | 38 | 0 | 46 | 5 | 0 | 52 | 146 | butter | $0.70 |

### Batch Record

```
Batch {
  id, name, date,
  oils: [{name, weightOz}],
  superfat: number (default 5%),
  lyeConcentration: number (default 33%),
  fragrance: string,
  fragranceOz: number,
  colorant: string,
  notes: string,
  properties: {hardness, cleansing, conditioning, bubbly, creamy, iodine, ins},
  lyeCalc: {naohWeight, waterWeight, totalOilWeight, totalBatchWeight},
  qualityScore: number,
  status: "planning" | "in-progress" | "curing" | "complete",
  cureStartDate: date,
  cureEndDate: date,
  actualResults: {hardnessRating, latherRating, conditioningRating, scentRetention, overallRating, feedback},
  barsProduced: number,
  costPerBar: number
}
```

### Seed Batches
1. Lavender Dream Bar (Jan 15) — Olive/Coconut/Shea/Castor, superfat 5%, score 78
2. Charcoal Detox Bar (Feb 3) — Coconut/Olive/Palm/Castor, superfat 3%, score 82
3. Oatmeal Honey Gentle (Feb 20) — Olive/Coconut/Shea/Castor/Avocado, superfat 8%
