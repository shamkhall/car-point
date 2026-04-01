import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/car-point';

interface CsvRow {
  [key: string]: string;
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of content) {
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current.trim());

  const headers = parseRow(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] ?? '').trim();
    });
    return row;
  });
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseDistance(distance: string): number {
  // "175 000 km" → 175000, "0 km" → 0
  const cleaned = distance.replace(/\s/g, '').replace(/km/i, '');
  return parseInt(cleaned, 10) || 0;
}

const TRANSMISSION_MAP: Record<string, string> = {
  avtomat: 'automatic',
  mexaniki: 'manual',
  robot: 'semi-automatic',
  variator: 'automatic',
};

const DRIVE_MAP: Record<string, string> = {
  'ön': 'FWD',
  tam: 'AWD',
  arxa: 'RWD',
};

const FUEL_MAP: Record<string, string> = {
  benzin: 'petrol',
  dizel: 'diesel',
  hibrid: 'hybrid',
  'plug-in hibrid': 'hybrid',
  elektro: 'hybrid',
  qaz: 'LPG',
};

const NEW_MAP: Record<string, boolean> = {
  'bəli': true,
  xeyr: false,
};

function getPriceFilename(dataDir: string): string {
  // Support both old (turbo.csv) and new (turbo_az_full.csv) datasets
  const fullPath = path.join(dataDir, 'turbo_az_full.csv');
  const oldPath = path.join(dataDir, 'turbo.csv');
  if (fs.existsSync(fullPath)) return fullPath;
  return oldPath;
}

async function seedPrices(db: mongoose.Connection, dataDir: string) {
  const collection = db.collection('car_prices');
  await collection.deleteMany({});

  const priceFile = getPriceFilename(dataDir);
  const rows = parseCsv(priceFile);
  const isNewFormat = rows.length > 0 && 'Band' in rows[0];

  const docs = rows
    .filter((row) => row['Price'] && parseFloat(row['Price']) > 0)
    .filter((row) => row['Currency'] === 'AZN')
    .map((row) => {
      if (isNewFormat) {
        // HuggingFace vrashad/turbo_az format
        return {
          brand: (row['Band'] ?? '').toLowerCase(),
          model: (row['Model'] ?? '').toLowerCase(),
          year: parseInt(row['Year'], 10),
          bodyType: (row['Ban type'] ?? '').toLowerCase(),
          engine: FUEL_MAP[(row['Fuel type'] ?? '').toLowerCase()] ?? (row['Fuel type'] ?? '').toLowerCase(),
          transmission: TRANSMISSION_MAP[(row['Box'] ?? '').toLowerCase()] ?? (row['Box'] ?? '').toLowerCase(),
          drive: DRIVE_MAP[(row['Gear'] ?? '').toLowerCase()] ?? (row['Gear'] ?? '').toUpperCase(),
          color: (row['Color'] ?? '').toLowerCase(),
          city: '',
          price: parseFloat(row['Price']),
          mileage: 0,
        };
      }
      // Old turbo.csv format
      return {
        brand: (row['Brand'] ?? '').toLowerCase(),
        model: (row['Model'] ?? '').toLowerCase(),
        year: parseInt(row['Year'], 10),
        bodyType: (row['Body Type'] ?? '').toLowerCase(),
        engine: FUEL_MAP[(row['Fuel Type'] ?? '').toLowerCase()] ?? (row['Fuel Type'] ?? '').toLowerCase(),
        transmission: TRANSMISSION_MAP[(row['Transmission'] ?? '').toLowerCase()] ?? (row['Transmission'] ?? '').toLowerCase(),
        drive: DRIVE_MAP[(row['Drive Type'] ?? '').toLowerCase()] ?? (row['Drive Type'] ?? '').toUpperCase(),
        color: (row['Color'] ?? '').toLowerCase(),
        city: (row['City'] ?? '').toLowerCase(),
        price: parseFloat(row['Price']),
        mileage: parseDistance(row['Distance'] ?? '0'),
      };
    });

  if (docs.length > 0) {
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} price records from ${path.basename(priceFile)}`);
  }
}

async function seedReliability(db: mongoose.Connection, dataDir: string) {
  const collection = db.collection('car_reliability');
  await collection.deleteMany({});

  const rows = parseCsv(path.join(dataDir, 'reliability.csv'));

  const scores = rows
    .map((row) => parseFloat(row['Overall Score'] ?? '0'))
    .filter((s) => s > 0)
    .sort((a, b) => b - a);

  function getTier(score: number): string {
    if (scores.length === 0 || score <= 0) return 'D';
    const rank = scores.indexOf(score);
    const percentile = rank / scores.length;
    if (percentile < 0.2) return 'S';
    if (percentile < 0.4) return 'A';
    if (percentile < 0.6) return 'B';
    if (percentile < 0.8) return 'C';
    return 'D';
  }

  const docs = rows
    .filter((row) => row['Make'])
    .map((row) => ({
      brand: (row['Make'] ?? '').toLowerCase(),
      model: (row['Model'] ?? '').toLowerCase() || null,
      tier: getTier(parseFloat(row['Overall Score'] ?? '0')),
    }));

  if (docs.length > 0) {
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} reliability records`);
  }
}

async function seedDepreciation(db: mongoose.Connection, dataDir: string) {
  // Calculate depreciation from turbo.az data:
  // For each brand+model, compare avg price of newer cars (0-2 years old) vs older (5-7 years old)
  const priceFile = getPriceFilename(dataDir);
  const rows = parseCsv(priceFile);
  const isNewFormat = rows.length > 0 && 'Band' in rows[0];
  const currentYear = new Date().getFullYear();

  const pricesByBrandModel: Record<string, { newPrices: number[]; oldPrices: number[] }> = {};

  for (const row of rows) {
    if (!row['Price'] || parseFloat(row['Price']) <= 0) continue;
    if (row['Currency'] !== 'AZN') continue;

    const brand = (isNewFormat ? row['Band'] : row['Brand'] ?? '').toLowerCase();
    const model = (row['Model'] ?? '').toLowerCase();
    const year = parseInt(row['Year'], 10);
    const price = parseFloat(row['Price']);
    const key = `${brand}|${model}`;
    const age = currentYear - year;

    if (!pricesByBrandModel[key]) {
      pricesByBrandModel[key] = { newPrices: [], oldPrices: [] };
    }

    if (age <= 2) {
      pricesByBrandModel[key].newPrices.push(price);
    } else if (age >= 5 && age <= 7) {
      pricesByBrandModel[key].oldPrices.push(price);
    }
  }

  const collection = db.collection('car_depreciation');
  await collection.deleteMany({});

  const docs: { brand: string; model: string; retentionPercent: number }[] = [];

  for (const [key, data] of Object.entries(pricesByBrandModel)) {
    if (data.newPrices.length < 2 || data.oldPrices.length < 2) continue;

    const avgNew = data.newPrices.reduce((a, b) => a + b, 0) / data.newPrices.length;
    const avgOld = data.oldPrices.reduce((a, b) => a + b, 0) / data.oldPrices.length;

    if (avgNew <= 0) continue;

    const [brand, model] = key.split('|');
    const retention = Math.round((avgOld / avgNew) * 100);

    docs.push({ brand, model, retentionPercent: Math.min(retention, 100) });
  }

  if (docs.length > 0) {
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} depreciation records (calculated from price data)`);
  } else {
    console.log('No depreciation data could be calculated (need 2+ listings per age group)');
  }
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) {
    console.error('Usage: ts-node src/seed/seed.ts <data-directory>');
    console.error('Expected CSV files: turbo.csv, reliability.csv');
    process.exit(1);
  }

  const conn = await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    await seedPrices(conn.connection, dataDir);
    await seedReliability(conn.connection, dataDir);
    await seedDepreciation(conn.connection, dataDir);
    console.log('Seeding complete');
  } finally {
    await conn.disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
