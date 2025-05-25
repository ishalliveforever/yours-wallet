const express = require('express');
const path = require('path');
const app = express();

const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Always serve index.html for any route except real files
app.get('*', (req, res) => {
  if (req.path === '/browser.html') {
    res.sendFile(path.join(buildPath, 'browser.html'));
  } else {
    res.sendFile(path.join(buildPath, 'index.html'));
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});