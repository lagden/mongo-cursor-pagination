'use strict'

const test = require('ava')
const {ObjectID} = require('mongodb')
const bsonUrlEncoding = require('../../src/utils/bsonUrlEncoding')
const dbUtils = require('../helper/db')

let mongod
test.before('start mongo server', async () => {
	mongod = dbUtils.start()
})

test.beforeEach(async t => {
	t.context.db = await dbUtils.db(mongod)
})

test('should encode and decode complex objects', async t => {
	const obj = {
		_id: new ObjectID('58164d86f69ab45942c6ff38'),
		date: new Date('Sun Oct 30 2016 12:32:35 GMT-0700 (PDT)'),
		number: 1,
		string: 'complex String &$##$-/?'
	}
	await t.context.db.collection('test_objects').insertOne(obj)
	const bsonObject = await t.context.db.collection('test_objects').findOne({})
	const str = bsonUrlEncoding.encode(bsonObject)

	t.is(str, 'eyJfaWQiOnsiJG9pZCI6IjU4MTY0ZDg2ZjY5YWI0NTk0MmM2ZmYzOCJ9LCJkYXRlIjp7IiRkYXRlIjoiMjAxNi0xMC0zMFQxOTozMjozNVoifSwibnVtYmVyIjoxLCJzdHJpbmciOiJjb21wbGV4IFN0cmluZyAmJCMjJC0vPyJ9')

	const decoded = bsonUrlEncoding.decode(str)

	// Check types
	t.is(typeof decoded.date, 'object')
	t.is(typeof decoded.number, 'number')
	t.is(typeof decoded.string, 'string')
})
