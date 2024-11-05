// server.js
const express = require('express');
const multer = require('multer');
const { processFile } = require('./gptService'); // Service to process the file with GPT

const app = express();
const upload = multer({ dest: 'uploads/' }); // Directory to save uploaded files

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await processFile(filePath); // Process the file with GPT
    res.status(200).json({ message: 'File processed successfully', result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
