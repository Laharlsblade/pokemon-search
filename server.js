const express = require('express');
const app = express();
const path = require('path');
const port = 4631;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/index.js', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.js'));
});

app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.css'));
});

// app.get('/data.json', (req, res) => {
//     res.sendFile(path.join(__dirname + '/data.json'));
// });

app.use('/data', express.static('data'))

app.listen(port);

console.log(`Running on port ${port}`);
