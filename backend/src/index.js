require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const scraperRoutes = require('./routes/scraperRoutes');
app.use('/api', scraperRoutes);

app.get('/', (req, res) => {
    res.send('Melon Music App API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
