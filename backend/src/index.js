require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const scraperRoutes = require('./routes/scraperRoutes');
app.use('/api', scraperRoutes);

const rankingsRoutes = require('./routes/rankingsRoutes');
app.use('/api', rankingsRoutes);


app.get('/', (req, res) => {
    res.send('Melon Music App API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Testing DB connection
const pool = require('./config/db');

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS current_time;');
        res.json({ success: true, db_time: result.rows[0].current_time });
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

