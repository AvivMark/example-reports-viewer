const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

// Create an Express app
const app = express();
const port = 5000;

// Allow Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Define the directory where Jest JSON reports will be stored
const reportsDir = path.join(__dirname, 'jest-reports');

// Make sure the directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reportsDir); // Files will be uploaded to the `jest-reports` folder
  },
  filename: (req, file, cb) => {
    // Store the file with its original name
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// API to get the list of Jest JSON reports
app.get('/api/reports', (req, res) => {
  fs.readdir(reportsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read reports directory' });
    }

    const jsonFiles = files.filter(file => file.endsWith('.json')); // Only consider .json files

    // Respond with a list of files
    const reports = jsonFiles.map((file) => ({
      fileName: file,
      content: JSON.parse(fs.readFileSync(path.join(reportsDir, file), 'utf-8')), // Read and parse each JSON file
    }));

    res.json(reports);
  });
});

// API to upload new Jest JSON report file
app.post('/api/upload', upload.single('report'), (req, res) => {
  // The uploaded file will be available in `req.file`
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Ensure the file is a valid JSON file
  const fileExtension = path.extname(req.file.originalname);
  if (fileExtension !== '.json') {
    return res.status(400).json({ error: 'Only JSON files are allowed' });
  }

  // Respond with success
  res.status(200).json({
    message: 'File uploaded successfully!',
    fileName: req.file.originalname,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
