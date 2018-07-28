const request = require('request');

request({
    url: 'http://127.0.0.1:3011',
    method: 'POST',
    json: true
}, (err, response, body) => {
    console.log(response.statusCode);
    
    try {
        body = JSON.parse(body);
        console.log(err, body)
    } catch (e) {
        console.log(body);
    }
});