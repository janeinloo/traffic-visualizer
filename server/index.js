import express from "express";
import dotenv from "dotenv";
import { XMLParser } from "fast-xml-parser";

dotenv.config();

const app = express();
const PORT = 3001;

const DATEX_TRAFFIC_URL =
  "https://tarktee.transpordiamet.ee/api/v1/datex/trafficData";

const DATEX_SITES_URL =
  "https://tarktee.transpordiamet.ee/api/v1/datex/measurementSites";

const TLT_GPS_URL =
  "https://transport.tallinn.ee/gps.txt";

const TLT_DEPARTURES_URL =
  "https://transport.tallinn.ee/siri-stop-departures.php";

const TLU_STOPS = {
  "1232": {
    name: "Tallinna Ülikool",
    latitude: 59.43854,
    longitude: 24.77137,
  },
  "1233": {
    name: "Tallinna Ülikool",
    latitude: 59.43837,
    longitude: 24.77133,
  },
};

// Traffic muutub tihti.
const TRAFFIC_CACHE_DURATION_MS = 2 * 60 * 1000;

// Mõõtepunktide asukohad muutuvad harva.
const SITES_CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

let trafficCache = null;
let trafficCacheTime = 0;

let sitesCache = null;
let sitesCacheTime = 0;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});


// Helper-funktsioonid

function secondsToTime(seconds) {
  const normalized =
    ((Number(seconds) % 86400) + 86400) %
    86400;

  const hours = Math.floor(
    normalized / 3600
  );

  const minutes = Math.floor(
    (normalized % 3600) / 60
  );

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function getSecondsUntil(
  targetSeconds,
  currentSeconds
) {
  let difference =
    targetSeconds - currentSeconds;

  // Südaöö üleminek
  if (difference < -12 * 60 * 60) {
    difference += 24 * 60 * 60;
  }

  return difference;
}

function asArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getTextValue(value) {
  if (value == null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return value["#text"] ?? null;
}

function parseMeasurementSiteId(siteReferenceId) {
  if (!siteReferenceId) {
    return {
      id: null,
      direction: null,
    };
  }

  const match = siteReferenceId.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(\d+)$/i
  );

  if (!match) {
    return {
      id: siteReferenceId,
      direction: null,
    };
  }

  return {
    id: match[1],
    direction: Number(match[2]),
  };
}

function getTrafficValues(measuredValues) {
  let speed = null;
  let flow = null;
  let measurementPeriodSeconds = null;

  for (const item of asArray(measuredValues)) {
    const basicData =
      item?.measuredValue?.basicData;

    if (!basicData) {
      continue;
    }

    const type = basicData["xsi:type"];

    if (
      measurementPeriodSeconds === null &&
      basicData.measurementOrCalculationPeriod != null
    ) {
      measurementPeriodSeconds = Number(
        basicData.measurementOrCalculationPeriod
      );
    }

    if (type === "TrafficSpeed") {
      const value =
        basicData.averageVehicleSpeed?.speed;

      if (value != null) {
        speed = Number(value);
      }
    }

    if (type === "TrafficFlow") {
      const value =
        basicData.vehicleFlow?.vehicleFlowRate;

      if (value != null) {
        flow = Number(value);
      }
    }
  }

  return {
    speed,
    flow,
    measurementPeriodSeconds,
  };
}

async function fetchDatexXml(url) {
  const apiKey = process.env.DATEX_API_KEY;

  if (!apiKey) {
    throw new Error("DATEX_API_KEY puudub.");
  }

  const response = await fetch(url, {
    headers: {
      "X-DATEX-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `DATEX päring ebaõnnestus: ${response.status}`
    );
  }

  return response.text();
}


// Traffic Data


async function loadTrafficData() {
  const now = Date.now();

  if (
    trafficCache &&
    now - trafficCacheTime < TRAFFIC_CACHE_DURATION_MS
  ) {
    return {
      ...trafficCache,
      cached: true,
    };
  }

  const xml = await fetchDatexXml(
    DATEX_TRAFFIC_URL
  );

  const parsed = parser.parse(xml);

  const publication =
    parsed?.d2LogicalModel?.payloadPublication;

  if (!publication) {
    throw new Error(
      "Traffic Data payloadPublication puudub."
    );
  }

  const siteMeasurements = asArray(
    publication.siteMeasurements
  );

  const measurements = siteMeasurements
    .map((site) => {
      const siteReferenceId =
        site?.measurementSiteReference?.id;

      if (!siteReferenceId) {
        return null;
      }

      const { id, direction } =
        parseMeasurementSiteId(siteReferenceId);

      const {
        speed,
        flow,
        measurementPeriodSeconds,
      } = getTrafficValues(site.measuredValue);

      return {
        id,
        siteReferenceId,
        direction,
        measurementTime:
          site.measurementTimeDefault ?? null,
        speed,
        flow,
        measurementPeriodSeconds,
      };
    })
    .filter(Boolean);

  const uniqueSiteCount = new Set(
    measurements.map((measurement) => measurement.id)
  ).size;

  const result = {
    feedType: publication.feedType ?? null,
    publicationTime:
      publication.publicationTime ?? null,
    measurementSiteTable:
      publication.measurementSiteTableReference?.id ??
      null,
    count: measurements.length,
    uniqueSiteCount,
    measurements,
  };

  trafficCache = result;
  trafficCacheTime = Date.now();

  return {
    ...result,
    cached: false,
  };
}


// Measurement Sites


async function loadSitesData() {
  const now = Date.now();

  if (
    sitesCache &&
    now - sitesCacheTime < SITES_CACHE_DURATION_MS
  ) {
    return {
      ...sitesCache,
      cached: true,
    };
  }

  const xml = await fetchDatexXml(
    DATEX_SITES_URL
  );

  const parsed = parser.parse(xml);

  const publication =
    parsed?.d2LogicalModel?.payloadPublication;

  if (!publication) {
    throw new Error(
      "Measurement Sites payloadPublication puudub."
    );
  }

  const tables = asArray(
    publication.measurementSiteTable
  );

  if (tables.length === 0) {
    throw new Error(
      "measurementSiteTable puudub."
    );
  }

  const table = tables[0];

  const records = tables.flatMap((item) =>
    asArray(item?.measurementSiteRecord)
  );

  const sites = records
    .map((record) => {
      const siteReferenceId = record?.id;

      if (!siteReferenceId) {
        return null;
      }

      const { id, direction } =
        parseMeasurementSiteId(siteReferenceId);

      const coordinates =
        record?.measurementSiteLocation
          ?.pointByCoordinates
          ?.pointCoordinates;

      const latitude = Number(
        coordinates?.latitude
      );

      const longitude = Number(
        coordinates?.longitude
      );

      const rawName = getTextValue(
        record?.measurementSiteName
          ?.values?.value
      );

      const name =
        rawName?.replace(
          /\s+\((forwards|backwards)\)$/i,
          ""
        ) ?? null;

      return {
        id,
        siteReferenceId,
        direction,
        name,
        latitude,
        longitude,
        lanes:
          record?.measurementSiteNumberOfLanes !=
          null
            ? Number(
                record.measurementSiteNumberOfLanes
              )
            : null,
      };
    })
    .filter(
      (site) =>
        site &&
        Number.isFinite(site.latitude) &&
        Number.isFinite(site.longitude)
    );

  const uniqueSiteCount = new Set(
    sites.map((site) => site.id)
  ).size;

  const result = {
    feedType: publication.feedType ?? null,
    publicationTime:
      publication.publicationTime ?? null,
    tableId: table?.id ?? null,
    recordCount: sites.length,
    uniqueSiteCount,
    sites,
  };

  sitesCache = result;
  sitesCacheTime = Date.now();

  return {
    ...result,
    cached: false,
  };
}


// API: raw normalized traffic


app.get("/api/traffic", async (_req, res) => {
  try {
    const data = await loadTrafficData();

    res.json(data);
  } catch (error) {
    console.error("Traffic Data viga:", error);

    res.status(500).json({
      error: "Traffic Data laadimine ebaõnnestus.",
    });
  }
});


// API: raw normalized measurement sites


app.get("/api/sites", async (_req, res) => {
  try {
    const data = await loadSitesData();

    res.json(data);
  } catch (error) {
    console.error("Measurement Sites viga:", error);

    res.status(500).json({
      error:
        "Measurement Sites laadimine ebaõnnestus.",
    });
  }
});


// API: lõplik kaardiandmete merge


app.get("/api/traffic-map", async (_req, res) => {
  try {
    const [sitesData, trafficData] =
      await Promise.all([
        loadSitesData(),
        loadTrafficData(),
      ]);

    // Traffic measurement lookup täpse direction-ID järgi.
    const measurementByReference = new Map(
      trafficData.measurements.map(
        (measurement) => [
          measurement.siteReferenceId,
          measurement,
        ]
      )
    );

    // Üks objekt ühe füüsilise mõõtekoha kohta.
    const pointMap = new Map();

    for (const site of sitesData.sites) {
      if (!pointMap.has(site.id)) {
        pointMap.set(site.id, {
          id: site.id,
          name: site.name,
          latitude: site.latitude,
          longitude: site.longitude,
          directions: {},
        });
      }

      const point = pointMap.get(site.id);

      const measurement =
        measurementByReference.get(
          site.siteReferenceId
        );

      const directionKey =
        site.direction != null
          ? String(site.direction)
          : site.siteReferenceId;

      point.directions[directionKey] = {
        siteReferenceId: site.siteReferenceId,
        direction: site.direction,
        lanes: site.lanes,
        measurementTime:
          measurement?.measurementTime ?? null,
        speed: measurement?.speed ?? null,
        flow: measurement?.flow ?? null,
        measurementPeriodSeconds:
          measurement?.measurementPeriodSeconds ??
          null,
      };
    }

    const points = Array.from(
      pointMap.values()
    ).map((point) => {
      const directions = Object.values(
        point.directions
      );

      const activeDirections =
        directions.filter(
          (direction) =>
            direction.flow != null ||
            direction.speed != null
        );

      const flowValues = activeDirections
        .map((direction) => direction.flow)
        .filter(
          (value) =>
            typeof value === "number" &&
            Number.isFinite(value)
        );

      const speedValues = activeDirections
        .map((direction) => direction.speed)
        .filter(
          (value) =>
            typeof value === "number" &&
            Number.isFinite(value)
        );

      const measurementTimes =
        activeDirections
          .map(
            (direction) =>
              direction.measurementTime
          )
          .filter(Boolean);

      const totalFlow =
        flowValues.length > 0
          ? flowValues.reduce(
              (sum, value) => sum + value,
              0
            )
          : null;

      const averageSpeed =
        speedValues.length > 0
          ? speedValues.reduce(
              (sum, value) => sum + value,
              0
            ) / speedValues.length
          : null;

      const latestMeasurementTime =
        measurementTimes.length > 0
          ? measurementTimes.sort(
              (a, b) =>
                new Date(b).getTime() -
                new Date(a).getTime()
            )[0]
          : null;

      return {
        ...point,
        hasTrafficData:
          activeDirections.length > 0,
        activeDirectionCount:
          activeDirections.length,
        totalFlow,
        averageSpeed,
        latestMeasurementTime,
      };
    });

    const activePoints = points.filter(
      (point) => point.hasTrafficData
    );

    res.json({
      sitesPublicationTime:
        sitesData.publicationTime,
      trafficPublicationTime:
        trafficData.publicationTime,

      siteCount: points.length,
      activeSiteCount: activePoints.length,

      measurementCount:
        trafficData.measurements.length,

      points,
    });
  } catch (error) {
    console.error(
      "Traffic map merge viga:",
      error
    );

    res.status(500).json({
      error:
        "DATEX kaardiandmete koostamine ebaõnnestus.",
    });
  }
});

app.get("/api/trams", async (_req, res) => {
  try {
    const response = await fetch(TLT_GPS_URL);

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          "TLT trammiandmete päring ebaõnnestus.",
      });
    }

    const text = await response.text();

    const trams = text
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",");

        const rawLine = parts[1];

        return {
          type: parts[0],

          // T1 -> 1, T3 -> 3
          line: rawLine?.replace(/^T/, ""),

          longitude:
            Number(parts[2]) / 1_000_000,

          latitude:
            Number(parts[3]) / 1_000_000,

          vehicleId: parts[6] ?? null,

          destination:
            parts[9] ?? null,
        };
      })
      .filter(
        (vehicle) =>
          vehicle.type === "3" &&
          (vehicle.line === "1" ||
            vehicle.line === "3") &&
          Number.isFinite(
            vehicle.latitude
          ) &&
          Number.isFinite(
            vehicle.longitude
          )
      );

    res.json({
      count: trams.length,
      trams,
    });
  } catch (error) {
    console.error(
      "TLT trammiandmete viga:",
      error
    );

    res.status(500).json({
      error:
        "TLT trammiandmete töötlemine ebaõnnestus.",
    });
  }
});

app.get(
  "/api/tram-departures",
  async (_req, res) => {
    try {
      const stopIds = Object.keys(
        TLU_STOPS
      ).join(",");

      const response = await fetch(
        `${TLT_DEPARTURES_URL}?stopid=${stopIds}`
      );

      if (!response.ok) {
        return res
          .status(response.status)
          .json({
            error:
              "TLT väljumiste päring ebaõnnestus.",
          });
      }

      const text = await response.text();

      const lines = text
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        throw new Error(
          "Väljumiste vastus oli tühi."
        );
      }

      // Header sisaldab TLT enda hetke aega
      // sekundites alates südaööst.
      const header = lines[0].split(",");

      const currentSeconds = Number(
        header[4]
      );

      let currentStopId = null;

      const departures = [];

      for (const line of lines.slice(1)) {
        const parts = line.split(",");

        if (parts[0] === "stop") {
          currentStopId = parts[1];
          continue;
        }

        if (
          !currentStopId ||
          !TLU_STOPS[currentStopId]
        ) {
          continue;
        }

        const route =
          parts[1]?.replace(
            /^T/i,
            ""
          ) ?? "";

        // Meid huvitavad ainult trammid 1 ja 3.
        if (
          route !== "1" &&
          route !== "3"
        ) {
          continue;
        }

        const expectedSeconds =
          Number(parts[2]);

        const scheduledSeconds =
          Number(parts[3]);

        if (
          !Number.isFinite(
            expectedSeconds
          ) ||
          !Number.isFinite(
            scheduledSeconds
          )
        ) {
          continue;
        }

        const secondsUntil =
          getSecondsUntil(
            expectedSeconds,
            currentSeconds
          );

        // Kuvame ainult järgmise tunni.
        if (
          secondsUntil < 0 ||
          secondsUntil > 60 * 60
        ) {
          continue;
        }

        const stop =
          TLU_STOPS[currentStopId];

        departures.push({
          stopId: currentStopId,
          stopName: stop.name,

          line: route,

          destination:
            parts[4] ?? null,

          expectedTime:
            secondsToTime(
              expectedSeconds
            ),

          scheduledTime:
            secondsToTime(
              scheduledSeconds
            ),

          minutesUntil: Math.ceil(
            secondsUntil / 60
          ),

          delayMinutes: Math.round(
            (expectedSeconds -
              scheduledSeconds) /
              60
          ),
        });
      }

      departures.sort(
        (a, b) =>
          a.minutesUntil -
          b.minutesUntil
      );

      res.json({
        stopName:
          "Tallinna Ülikool",

        currentTime:
          Number.isFinite(
            currentSeconds
          )
            ? secondsToTime(
                currentSeconds
              )
            : null,

        stops: Object.entries(
          TLU_STOPS
        ).map(([id, stop]) => ({
          id,
          ...stop,
        })),

        count: departures.length,

        departures:
          departures.slice(0, 12),
      });
    } catch (error) {
      console.error(
        "TLT väljumiste viga:",
        error
      );

      res.status(500).json({
        error:
          "TLT väljumiste töötlemine ebaõnnestus.",
      });
    }
  }
);


// Server


app.listen(PORT, () => {
  console.log(
    `DATEX proxy töötab: http://localhost:${PORT}`
  );
});