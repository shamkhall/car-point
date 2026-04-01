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
    .filter((row) => row.price && parseFloat(row.price) > 0)
    .map((row) => ({
      brand: (row.brand ?? row.make ?? '').toLowerCase(),
      model: (row.model ?? '').toLowerCase(),
      year: parseInt(row.year, 10),
      bodyType: (row.body_type ?? '').toLowerCase(),
      engine: (row.engine ?? row.fuel_type ?? '').toLowerCase(),
      transmission: (row.transmission ?? '').toLowerCase(),
      drive: (row.drive ?? '').toUpperCase(),
      color: (row.color ?? '').toLowerCase(),
      city: (row.city ?? '').toLowerCase(),
      price: parseFloat(row.price),
      mileage: parseInt(row.mileage ?? '0', 10),
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
  const docs = rows.map((row) => ({
    brand: (row.brand ?? row.make ?? '').toLowerCase(),
    model: (row.model ?? '').toLowerCase() || null,
    tier: row.tier ?? 'D',
  }));

  if (docs.length > 0) {
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} reliability records`);
  }
}

async function seedSafety(db: mongoose.Connection, dataDir: string) {
  const collection = db.collection('car_safety');
  await collection.deleteMany({});

  const rows = parseCsv(path.join(dataDir, 'safety.csv'));
  const docs = rows.map((row) => ({
    brand: (row.brand ?? row.make ?? '').toLowerCase(),
    model: (row.model ?? '').toLowerCase(),
    year: parseInt(row.year ?? '0', 10),
    stars: parseInt(row.stars ?? row.rating ?? '0', 10),
  }));

  if (docs.length > 0) {
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} safety records`);
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
    console.error('Expected CSV files: turbo_az.csv, reliability.csv, safety.csv, depreciation.csv');
    process.exit(1);
  }

  const conn = await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    await seedPrices(conn.connection, dataDir);
    await seedReliability(conn.connection, dataDir);
    await seedSafety(conn.connection, dataDir);
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
