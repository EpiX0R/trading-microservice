const mongo = require("mongodb").MongoClient;
const dsn =  process.env.TRADING_DSN || "mongodb://127.0.0.1:27017/trading";
const dayjs = require("dayjs");

/**
 * A class for handling users in the database.
 */
class Stocks {
    /**
     * 
     * @param {string} stock    The stock shorthand name to search for.
     *
     * @throws {MongoError}     Error if operation fails.
     * 
     * @returns {Array}         The results of the query.
     */
    async getStock(stock) {
        try {
            const client  = await mongo.connect(dsn);
            const db = await client.db();
            const col = await db.collection("stocks");
            let res = [];
            if (stock !== undefined) {
                res = await col.find({shorthand: stock}).toArray();
            } else {
                res = await col.find().toArray();
            }
    
            await client.close();
    
            if (res.length === 0) {
                throw new Error("Stock not found");
            }

            return res;
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Retrieves a users specific shares in a stock.
     *
     * @param {string} stock    The stock shorthand name to search for.
     * @param {string} userid   The user id to search for.
     *
     * @throws {MongoError}     Error if operation fails.
     * 
     * @returns {Array}         The results of the query.
     */
    async getShares(stock, userid) {
        try {
            const client  = await mongo.connect(dsn);
            const db = await client.db();
            const col = await db.collection("shareOwners");
            const res = await col.find({stock: stock, owner: userid}).toArray();
    
            await client.close();
    
            return res;
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Retrieves the last amount of days closing values for a stock.
     *
     * @param {String} stock    The stock shorthand name to search for
     * @param {Number} days     The amount of days to retrieve.
     */
    async getPreviousData(stock, days) {
        const stockData = await this.getStock(stock);
        try {
            const client  = await mongo.connect(dsn);
            const db = await client.db();
            const col = await db.collection("dailyPrices");
            const res = await col.find({shorthand: stock}, {limit: days}).sort({date: -1}).toArray();

            const data = res[res.length - 1];
            const date = new Date();
            // Remove first value
            //res.shift();
            // Add current price as latest value
            res.unshift({
                name: data.name,
                shorthand: stock,
                date: dayjs().toDate(),
                close: stockData[0].currentPrice
            })

            await client.close();
    
            return res;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new Stocks();