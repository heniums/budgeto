import { resetConfig } from '../src/config';
import { TEST_DATABASE_URL } from './constants';

// Set the test database URL and reset the config cache before each test file
// runs, ensuring tests use the embedded PostgreSQL instance.
process.env.DATABASE_URL = TEST_DATABASE_URL;
resetConfig();
