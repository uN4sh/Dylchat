const app = require("./app");

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

const { API_HOST } = process.env;

// server listening 
const server = app.listen(port, function () {
    const host = process.env.HOST || API_HOST;
    const port = server.address().port;
    console.log(`listening on http://${host}:${port}`);
});
