/* Base */
const express = require("express");
const app = express();
const cors = require('cors');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const dayjs = require('dayjs');
const schedule = require('node-schedule');

const Stocks = require("./modules/Stocks");

const port = 3001;

const mongo = require("mongodb").MongoClient;
const dsn =  process.env.TRADING_DSN || "mongodb://127.0.0.1:27017/trading";

if (process.env.NODE_ENV !== "production") {
    "http://127.0.0.1:4200",
    "http://localhost:4200",
    "http://127.0.0.1:1338",
    "http://localhost:1338"
}

/* Enable CORS */
app.use(cors({origin: [
    "https://trading.serverpojkarna.se",
    "https://trading-api.serverpojkarna.se"
], credentials: true}));

//io.origins(["https://tradingservice.serverpojkarna.se:443"])

schedule.scheduleJob("Save daily prices", {hours: 21, minute: 00}, async () => {
    stockData = await Stocks.getStock();
    let stocks = [];
    
    stockData.forEach((stock) => {
        stocks.push({
            name: stock.name,
            shorthand: stock.shorthand,
            date: dayjs().toDate(),
            close: stock.currentPrice
        });    
    });

    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection("dailyPrices");

    await col.insertMany(stocks);
    await client.close();
})

// every day at 9 pm save all stocks current price as close value in new dailyprices date 

io.on('connection', (socket) => {
    console.log("New connection.");

    /**
     * Updates the current price of the stock in the database.
     *
     * Conforms to requirement specification but is a bad way of handling price change.
     * Should be dealt with in same transaction session as the purchase/sell order and
     * emit socket call after transaction is finished.
     * 
     * Service uses worse solution for the purpose of conforming to requirement specification.
     */
    socket.on('update_price', async (data) => {
        const client  = await mongo.connect(dsn);
        const db = await client.db();
        const col = await db.collection("stocks");
        let trend = "trending_flat";

        let newPrice = data.currentPrice * (data.previouslyAvailable / data.currentlyAvailable);

        // Infinity fail-safe
        if (data.currentlyAvailable === 0) {
            newPrice = data.currentPrice * 2;
        }

        // 0 fail-safe
        if (data.previouslyAvailable === 0) {
            newPrice = data.currentPrice * 0.5;
        }

        newPrice = parseFloat(newPrice.toFixed(10));

        if (newPrice > data.yesterdayPrice) {
            trend = "trending_up"
        } else if (newPrice === data.yesterdayPrice) {
            trend = "trending_flat"
        } else if (newPrice < data.yesterdayPrice) {
            trend = "trending_down"
        }

        data.stock.trend = trend;
    
        await col.updateOne({shorthand: data.stock.shorthand}, {
            $set: {available: data.currentlyAvailable, currentPrice: newPrice, trend: trend}
        });

        io.emit("update_price", [data.stock, newPrice]);
        io.emit("update_share", data.stock.shorthand);
    });
});

io.on('disconnect', () => {
    console.log("Connection closed.")
});

/* Start Server */
server.listen(port, () => console.log(`Trading microservice running on port ${port}!`));

module.exports = server;