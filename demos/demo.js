let express = require('express');
let app = express();

app.get('/', function (req, res) {  
    res.send('Hello World!');
});

app.post('/data', function (req, res) {
    res.send('Data received!');
    console.log('POST /data endpoint was hit');
    // Log all data that was posted:
    req.on('data', chunk => {
        console.log(`Data chunk: ${chunk}`);
    });
    req.on('end', () => {
        console.log('No more data.');
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
