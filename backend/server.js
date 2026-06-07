const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', require('./routes/kyc'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Serveur KYC démarré → http://localhost:${PORT}`)
);