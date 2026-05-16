const path = require('path');

const entry = path.join(__dirname, 'dist', 'server.js');

try {
  require(entry);
} catch (error) {
  console.error(`Failed to start Node backend from ${entry}`);
  console.error(error);
  process.exit(1);
}
