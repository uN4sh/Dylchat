const app = require("./app");
require("dotenv").config();

const HOST = process.env.API_HOST;
const PORT = process.env.API_PORT;

// server listening 
app.listen(PORT, () => {
    console.log(`listening on http://${HOST}:${PORT}`);
});

