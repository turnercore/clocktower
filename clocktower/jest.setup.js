// jest.setup.js
const dotenv = require('dotenv')

// Load the environment variables from the .env.local file.
const envConfig = dotenv.config({ path: '.env.local' })

// Merge the loaded variables with process.env.
for (const k in envConfig.parsed) {
  process.env[k] = envConfig.parsed[k]
}
