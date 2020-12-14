'use strict'

const {MongoMemoryServer} = require('mongodb-memory-server')
const {MongoClient} = require('mongodb')

function start() {
	return new MongoMemoryServer({
		binary: {
			version: '4.0.6'
		}
	})
}

async function db(mongod) {
	const mongoConn = await mongod.getUri()
	const mongoDB = await mongod.getDbName()
	const client = await MongoClient.connect(mongoConn, {
		poolSize: 100,
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	return client.db(mongoDB, {noListener: true, returnNonCachedInstance: true})
}

module.exports = {
	db,
	start
}
