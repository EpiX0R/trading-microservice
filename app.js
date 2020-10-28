/* Base */
const express = require("express");
const app = express();
const cors = require('cors');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const Stocks = require("./modules/Stocks");

const port = 3000;

const mongo = require("mongodb").MongoClient;
const dsn =  process.env.TRADING_DSN || "mongodb://127.0.0.1:27017/trading";

/* Enable CORS */
app.use(cors({origin: [
    "http://127.0.0.1:4200",
    "http://localhost:4200",
    "https://trading.serverpojkarna.se"
], credentials: true}));

//io.origins(["https://tradingservice.serverpojkarna.se:443"])

io.on('connection', (socket) => {
    console.log("New connection.");

    /**
     * Updates the current price of the stock in the database.
     *
     * Conforms to requirement specification but is a bad way of handling price change.
     * Should be dealt with in same transaction session as the purchase/sell order and
     * emit socket call after transaction is finished.
     * 
     * Service uses worse solution for the security of conforming to requirement specification.
     */
    socket.on('update_price', async (data) => {
        const client  = await mongo.connect(dsn);
        const db = await client.db();
        const col = await db.collection("stocks");

        let newPrice = data.currentPrice * (data.previouslyAvailable / data.currentlyAvailable);

        // Infinity fail-safe
        if (data.currentlyAvailable === 0) {
            newPrice = data.currentPrice * 2;
        }

        // 0 fail-safe
        if (data.previouslyAvailable === 0) {
            newPrice = data.currentPrice * 0.5;
        }

        await col.updateOne({shorthand: data.stock}, {
            $set: {currentPrice: newPrice}
        });

        io.emit("update_price", [data.stock, newPrice]);
        io.emit("update_share", data.stock);
    });
});

io.on('disconnect', () => {
    console.log("Connection closed.")
});

/* Start Server */
server.listen(port, () => console.log(`Trading microservice running on port ${port}!`));

module.exports = server;