const express = require('express');
const app = express();
const mysql = require('mysql2');
const aws = require('aws-sdk');
const cors = require('cors');
const port = 3000;

app.use(cors());
app.use(express.json());  // For parsing application/json

// MySQL Database Setup
const db = mysql.createConnection({
  host: 'localhost', // or RDS endpoint if using RDS
  user: 'root',      // your DB username
  password: 'password', // your DB password
  database: 'media_db'
});

// S3 Setup
const s3 = new aws.S3({
  accessKeyId: 'your-access-key',
  secretAccessKey: 'your-secret-key',
  region: 'us-east-1' // specify your region
});

// Example route to fetch media data from the database
app.get('/media', (req, res) => {
  db.query('SELECT * FROM media', (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching media' });
    } else {
      res.json(result);
    }
  });
});

// Upload Media Route (from local to S3)
app.post('/upload', (req, res) => {
  const file = req.body.file; // Assuming file is base64 encoded or using multipart/form-data
  const params = {
    Bucket: 'your-s3-bucket-name',
    Key: `media/${file.name}`,
    Body: file.data,
    ContentType: file.mimetype
  };

  s3.upload(params, (err, data) => {
    if (err) {
      res.status(500).json({ message: 'Error uploading to S3' });
    } else {
      // Store the S3 URL in the database
      db.query('INSERT INTO media (title, description, url) VALUES (?, ?, ?)', [file.name, file.description, data.Location], (err, result) => {
        if (err) {
          res.status(500).json({ message: 'Error saving metadata in DB' });
        } else {
          res.json({ message: 'Upload successful', data: data.Location });
        }
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Backend API running on port ${port}`);
});
