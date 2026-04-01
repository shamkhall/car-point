import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/car-point';

interface CsvRow {
  [key: string]: string;
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim());
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });
    return row;
  });
}

async function seedPrices(db: mongoose.Connection, dataDir: string) {
  const collection = db.collection('car_prices');
  await collection.deleteMany({});

  const rows = parseCsv(path.join(dataDir, 'turbo_az.csv'));
  const docs = rows
    .filter((row) => row['Price'] && parseFloat(row['Price']) > 0)
    .map((row) => ({
      brand: (row['Brand'] ?? '').toLowerCase(),
      model: (row['Model'] ?? '').toLowerCase(),
      year: parseInt(row['Year'], 10),
      engine: (row['Fuel Type'] ?? '').toLowerCase(),
      color: (row['Color'] ?? '').toLowerCase(),
      price: parseFloat(row['Price']),
      mileage: parseInt(row['Distance'] ?? '0', 10),
    }));

  if (docs.length > 0) {
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} price records`);
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
    if (scores.length === 0) return 'D';
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
  const collection = db.collection('car_depreciation');
  await collection.deleteMany({});

  const rows = parseCsv(path.join(dataDir, 'depreciation.csv'));
  const docs = rows.map((row) => ({
    brand: (row.brand ?? row.make ?? '').toLowerCase(),
    model: (row.model ?? '').toLowerCase(),
    retentionPercent: parseFloat(row.retention_percent ?? '0'),
  }));

  if (docs.length > 0) {
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} depreciation records`);
  }
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) {
    console.error('Usage: ts-node src/seed/seed.ts <data-directory>');
    console.error('Expected CSV files: turbo_az.csv, reliability.csv, depreciation.csv');
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
