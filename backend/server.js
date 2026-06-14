const express = require('express');
const cors = require('cors');
const cities = require('./cities.json');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Endpoint to get all cities
app.get('/api/cities', (req, res) => {
  // We send the cities array as JSON
  res.json(cities);
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send('Türkiye Plaka - Şehir Eşleştirme Oyunu API Çalışıyor!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
