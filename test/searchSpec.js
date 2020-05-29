/* eslint unicorn/no-useless-undefined: 0 */

'use strict'

const test = require('ava')
const dbUtils = require('./helpers/db')
const paging = require('../src')

let mongod
test.before('start mongo server', async () => {
	mongod = dbUtils.start()
	const db = await dbUtils.db(mongod)

	await Promise.all([
		db.collection('test_paging_search').createIndex({mytext: 'text'}, {w: 1}),
		db.collection('test_duplicate_search').createIndex({mytext: 'text'}, {w: 1})
	])

	await Promise.all([
		db.collection('test_paging_search').insertMany([
			{
				mytext: 'one'
			},
			{
				mytext: 'one two'
			},
			{
				mytext: 'one two three'
			},
			{
				mytext: 'one two three four'
			},
			{
				mytext: 'one two three four five',
				group: 'one'
			},
			{
				mytext: 'one two three four five six',
				group: 'one'
			},
			{
				mytext: 'one two three four five six seven',
				group: 'one'
			},
			{
				mytext: 'one two three four five six seven eight',
				group: 'one'
			}
		]),
		db.collection('test_duplicate_search').insertMany([
			{
				_id: 6,
				mytext: 'one',
				counter: 1
			},
			{
				_id: 5,
				mytext: 'one',
				counter: 2
			},
			{
				_id: 4,
				mytext: 'one',
				counter: 3
			},
			{
				_id: 3,
				mytext: 'one two',
				counter: 4
			},
			{
				_id: 2,
				mytext: 'one two',
				counter: 5
			},
			{
				_id: 1,
				mytext: 'one two',
				counter: 6
			}
		])
	])
})

test.beforeEach(async t => {
	t.context.db = await dbUtils.db(mongod)
})

test('should query first few pages', async t => {
	const collection = t.context.db.collection('test_paging_search')
	// First page of 2
	let res = await paging.search(collection, 'one', {
		projection: {
			mytext: 1
		},
		limit: 2
	})

	t.is(res.results.length, 2)
	t.is(res.results[0].mytext, 'one')
	t.is(res.results[0].score, 1.1)
	t.is(res.results[1].mytext, 'one two')
	t.is(res.results[1].score, 0.75)
	t.falsy(res.previous)
	t.is(typeof res.next, 'string')

	// Go forward 2
	res = await paging.search(collection, 'one', {
		projection: {
			mytext: 1
		},
		limit: 3,
		next: res.next
	})

	t.is(res.results.length, 3)
	t.is(res.results[0].mytext, 'one two three')
	t.is(res.results[0].score, 0.6666666666666666)
	t.is(res.results[1].mytext, 'one two three four')
	t.is(res.results[1].score, 0.625)
	t.is(res.results[2].mytext, 'one two three four five')
	t.is(res.results[2].score, 0.6)
	t.is(typeof res.next, 'string')

	// Go forward another 2
	res = await paging.search(collection, 'one', {
		projection: {
			mytext: 1
		},
		limit: 4,
		next: res.next
	})

	t.is(res.results.length, 3)
	t.is(res.results[0].mytext, 'one two three four five six')
	t.is(res.results[0].score, 0.5833333333333334)
	t.is(res.results[1].mytext, 'one two three four five six seven')
	t.is(res.results[1].score, 0.5714285714285714)
	t.is(res.results[2].mytext, 'one two three four five six seven eight')
	t.is(res.results[2].score, 0.5625)
	t.is(res.next, undefined)
})

test('-> should query first few pages', async t => {
	const collection = t.context.db.collection('test_duplicate_search')
	// First page of 2.
	let res = await paging.search(collection, 'one', {
		projection: {
			mytext: 1,
			counter: 1
		},
		limit: 2
	})

	t.is(res.results.length, 2)
	t.is(res.results[0].counter, 1)
	t.is(res.results[1].counter, 2)
	t.falsy(res.previous)
	t.is(typeof res.next, 'string')

	// Go forward 2
	res = await paging.search(collection, 'one', {
		projection: {
			mytext: 1,
			counter: 1
		},
		limit: 2,
		next: res.next
	})

	t.is(res.results.length, 2)
	t.is(res.results[0].counter, 3)
	t.is(res.results[1].counter, 4)
	t.is(typeof res.next, 'string')

	// Go forward another 2
	res = await paging.search(collection, 'one', {
		projection: {
			mytext: 1,
			counter: 1
		},
		limit: 4,
		next: res.next
	})

	t.is(res.results.length, 2)
	t.is(res.results[0].counter, 5)
	t.is(res.results[1].counter, 6)
	t.is(res.next, undefined)
})

test('limit 0', async t => {
	const collection = t.context.db.collection('test_duplicate_search')
	// First page of 2.
	const res = await paging.search(collection, 'one', {
		projection: {
			mytext: 1,
			counter: 1
		},
		limit: 0
	})

	t.is(res.results.length, 1)
	t.is(res.results[0].counter, 1)
	t.falsy(res.previous)
	t.is(typeof res.next, 'string')
})

test('limit 1000', async t => {
	const collection = t.context.db.collection('test_duplicate_search')
	// First page of 2.
	const res = await paging.search(collection, 'one', {
		projection: {
			mytext: 1,
			counter: 1
		},
		limit: 1000
	})
	t.is(res.results.length, 6)
})

test.after.always(() => {
	mongod.stop()
})
