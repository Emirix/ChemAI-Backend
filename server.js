const app = require('./src/app');
const NewsScheduler = require('./src/services/newsScheduler');
require('dotenv').config();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`
  ################################################
  🛡️  ChemAI Backend Running on Port: ${port}   🛡️
  ################################################
  `);

  // Start the daily news scheduler
  NewsScheduler.start();
  console.log('📰 News scheduler initialized\n');
});
