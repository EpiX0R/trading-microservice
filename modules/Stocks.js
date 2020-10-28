const mongo = require("mongodb").MongoClient;
const dsn =  process.env.TRADING_DSN || "mongodb://127.0.0.1:27017/trading";

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
            const res = await col.find({shorthand: stock}).toArray();
    
            await client.close();
    
            if (res.length === 0) {
                throw new Error("Stock not found");
            }

            return res[0];
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Retrieves a users specific shares in a stock.
     *
     * @param {string} stock    The stock shorthand name to search for.
     * @param {string} id       The user id to search for.
     *
     * @throws {MongoError}     Error if operation fails.
     * 
     * @returns {Array}         The results of the query.
     */
    async getShares(stock, id) {
        try {
            const client  = await mongo.connect(dsn);
            const db = await client.db();
            const col = await db.collection("stockOwners");
            const res = await col.find({stock: stock, owner: id}).toArray();
    
            await client.close();
    
            return res;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new Stocks();