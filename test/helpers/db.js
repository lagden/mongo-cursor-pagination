'use strict'

import {MongoMemoryServer} from 'mongodb-memory-server'
import {MongoClient} from 'mongodb'

function start() {
	return new MongoMemoryServer({
		binary: {
			version: 'latest'
		}
	})
}

async function db(mongod) {
	const uri = await mongod.getConnectionString()
	const dbName = await mongod.getDbName()
	const client = await MongoClient.connect(uri, {
		useNewUrlParser: true
	})
	return client.db(dbName, {noListener: true, returnNonCachedInstance: true})
}

module.exports = {
	db,
	start
}
