import postgres from 'postgres';

// Create the connection
const client = postgres('postgres://postgres:tennis@localhost:5432/tennis_courts');

// Sample data for tennis courts
const sampleCourts = [
  {
    name: 'Grant Park Tennis Courts',
    address: '337 E Randolph St',
    city: 'Chicago',
    latitude: '41.88470000',
    longitude: '-87.62140000',
    numberOfCourts: 12,
    surfaceType: 'Hard',
    isIndoor: false,
    isLighted: true,
    isPublic: true,
  },
  {
    name: 'Lincoln Park Tennis Courts',
    address: '2045 N Lincoln Park W',
    city: 'Chicago',
    latitude: '41.92340000',
    longitude: '-87.63780000',
    numberOfCourts: 20,
    surfaceType: 'Hard',
    isIndoor: false,
    isLighted: true,
    isPublic: true,
  },
  {
    name: 'Midtown Athletic Club',
    address: '2444 N Elston Ave',
    city: 'Chicago',
    latitude: '41.92750000',
    longitude: '-87.68640000',
    numberOfCourts: 8,
    surfaceType: 'Hard',
    isIndoor: true,
    isLighted: true,
    isPublic: false,
  },
  {
    name: 'McFetridge Sports Center',
    address: '3843 N California Ave',
    city: 'Chicago',
    latitude: '41.95120000',
    longitude: '-87.69910000',
    numberOfCourts: 6,
    surfaceType: 'Hard',
    isIndoor: true,
    isLighted: true,
    isPublic: true,
  },
  {
    name: 'Waveland Tennis Courts',
    address: '3600 N Recreation Dr',
    city: 'Chicago',
    latitude: '41.93950000',
    longitude: '-87.63920000',
    numberOfCourts: 16,
    surfaceType: 'Hard',
    isIndoor: false,
    isLighted: true,
    isPublic: true,
  },
  {
    name: 'Oak Park Tennis Center',
    address: '218 Madison St',
    city: 'Oak Park',
    latitude: 41.8875,
    longitude: -87.7989,
    numberOfCourts: 10,
    surfaceType: 'Hard',
    isIndoor: false,
    isLighted: true,
    isPublic: true,
  },
  {
    name: 'Evanston Tennis Club',
    address: '1500 Central St',
    city: 'Evanston',
    latitude: 42.0475,
    longitude: -87.6889,
    numberOfCourts: 6,
    surfaceType: 'Clay',
    isIndoor: false,
    isLighted: true,
    isPublic: false,
  },
  {
    name: 'Glenview Tennis Club',
    address: '2400 Chestnut Ave',
    city: 'Glenview',
    latitude: 42.0775,
    longitude: -87.8289,
    numberOfCourts: 8,
    surfaceType: 'Hard',
    isIndoor: true,
    isLighted: true,
    isPublic: false,
  },
  {
    name: 'Skokie Sports Park',
    address: '3459 Oakton St',
    city: 'Skokie',
    latitude: 42.0375,
    longitude: -87.7489,
    numberOfCourts: 12,
    surfaceType: 'Hard',
    isIndoor: false,
    isLighted: true,
    isPublic: true,
  },
  {
    name: 'Winnetka Tennis Club',
    address: '1300 Oak St',
    city: 'Winnetka',
    latitude: 42.1075,
    longitude: -87.7389,
    numberOfCourts: 6,
    surfaceType: 'Clay',
    isIndoor: false,
    isLighted: true,
    isPublic: false,
  },
];

async function main() {
  try {
    // Create the table if it doesn't exist
    await client`CREATE TABLE IF NOT EXISTS tennis_courts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      latitude DECIMAL(10,8) NOT NULL,
      longitude DECIMAL(11,8) NOT NULL,
      number_of_courts INTEGER NOT NULL,
      surface_type VARCHAR(50) NOT NULL,
      is_indoor BOOLEAN NOT NULL DEFAULT FALSE,
      is_lighted BOOLEAN NOT NULL DEFAULT FALSE,
      is_public BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`;

    // Insert the sample data using raw SQL
    for (const court of sampleCourts) {
      await client`
        INSERT INTO tennis_courts (
          name, address, city, latitude, longitude, 
          number_of_courts, surface_type, is_indoor, is_lighted, is_public
        ) VALUES (
          ${court.name}, ${court.address}, ${court.city}, 
          ${court.latitude}, ${court.longitude}, 
          ${court.numberOfCourts}, ${court.surfaceType}, 
          ${court.isIndoor}, ${court.isLighted}, ${court.isPublic}
        )
      `;
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
