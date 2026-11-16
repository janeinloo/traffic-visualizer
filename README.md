# Traffic Visualizer

Traffic Visualizer on Reacti-põhine veebirakendus, mis visualiseerib Transpordiameti DATEX II liiklusandmeid Eesti kaardil.

Rakendus kasutab DATEX II `measurementSites` ja `trafficData` andmeallikaid. Mõõtepunktide asukohad ja värsked liiklusmõõtmised ühendatakse Node/Express backendis ning frontend kuvab aktiivsed mõõtepunktid interaktiivsel Leafleti kaardil.

## Funktsionaalsus

- aktiivsete liiklusmõõtepunktide kuvamine Eesti kaardil
- liikluskoormuse visualiseerimine markeri värvi ja suurusega
- mõõtepunktide otsing
- filtreerimine liikluskoormuse järgi
- mõõtepunkti detailvaade
- liiklusvoo kuvamine sõidusuundade kaupa
- keskmise kiiruse kuvamine
- mõõtmisaja ja andmete värskuse kuvamine
- kahe mõõtepunkti võrdlemine
- võrdlusgraafik
- liiklusandmete statistikavaade
- TOP 5 suurima liiklusvooga mõõtepunkti graafik
- DATEX andmete viimase uuendamise aja kuvamine

## Tehnoloogiad

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Leaflet
- React-Leaflet
- Recharts

### Backend

- Node.js
- Express
- dotenv
- fast-xml-parser

### Andmeallikas

Transpordiameti DATEX II API:

- `measurementSites` – mõõtepunktide asukohad ja metaandmed
- `trafficData` – värsked liiklusvoo ja keskmise kiiruse mõõtmised

API võtit kasutatakse ainult backendis ning seda ei saadeta frontendile.

## Projekti ülesehitus

```text
traffic-visualizer/
├── server/
│   └── index.js
├── src/
│   ├── components/
│   │   ├── TrafficComparison.tsx
│   │   ├── TrafficDetails.tsx
│   │   └── TrafficStats.tsx
│   ├── services/
│   │   └── trafficApi.ts
│   ├── types/
│   │   └── traffic.ts
│   ├── utils/
│   │   └── traffic.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
└── vite.config.ts
```

## Paigaldamine

### 1. Repositooriumi kloonimine

```bash
git clone <REPOSITORY_URL>
cd traffic-visualizer
```

### 2. Dependency'de paigaldamine

```bash
npm install
```

### 3. Keskkonnamuutuja seadistamine

Loo projekti juurkausta `.env` fail.

Näide:

```env
DATEX_API_KEY=your_api_key_here
```

DATEX API võtit ei tohi lisada GitHubi. Projekti `.gitignore` välistab `.env` faili versioonihaldusest.

Näidisväärtus on failis:

```text
.env.example
```

### 4. Backendi käivitamine

Käivita Node/Express server:

```bash
npm run server
```

Backend töötab vaikimisi aadressil:

```text
http://localhost:3001
```

### 5. Frontendi käivitamine

Ava teine terminal ning käivita:

```bash
npm run dev
```

Vite kuvab lokaalse aadressi, tavaliselt:

```text
http://localhost:5173
```

Frontend suunab `/api` päringud Vite proxy kaudu lokaalsele Express backendile.

## DATEX andmete töötlemine

Backend küsib andmeid kahest DATEX II teenusest:

```text
measurementSites
trafficData
```

`measurementSites` sisaldab mõõtepunktide asukohti ning `trafficData` sisaldab jooksvaid liiklusmõõtmisi.

Backend:

1. laadib DATEX XML andmed;
2. parsib XML-i `fast-xml-parser` abil;
3. normaliseerib mõõtepunktide ja mõõtmiste andmed;
4. ühendab need mõõtepunkti ID järgi;
5. tagastab frontendile valmis JSON-andmed `/api/traffic-map` endpointi kaudu.

Liiklusandmeid cache'itakse lühiajaliselt, et vältida ebavajalikke aeglaseid DATEX päringuid. Mõõtepunktide asukohti cache'itakse pikemalt, kuna need muutuvad harva.

## API endpointid

### `GET /api/traffic-map`

Rakenduse peamine endpoint. Tagastab mõõtepunktide asukohad koos olemasolevate liiklusmõõtmistega.

### `GET /api/traffic`

Tagastab normaliseeritud DATEX liiklusmõõtmised.

### `GET /api/sites`

Tagastab normaliseeritud DATEX mõõtepunktide andmed.

## Build ja koodi kontroll

Production build:

```bash
npm run build
```

ESLint kontroll:

```bash
npm run lint
```

## Märkused

DATEX on reaalajas muutuv andmeallikas. Seetõttu võib aktiivsete mõõtepunktide arv eri ajahetkedel muutuda.

Rakendus kuvab kaardil ainult mõõtepunkte, mille kohta on hetkel DATEX `trafficData` feedis liiklusmõõtmine olemas.
