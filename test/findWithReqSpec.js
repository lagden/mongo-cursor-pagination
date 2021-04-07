'use strict'

const test = require('ava')
const _ = require('lodash')
const dbUtils = require('./helper/db')
const paging = require('../src')

let mongod

test.before('start mongo server', async () => {
	mongod = dbUtils.start()
	const db = await dbUtils.db(mongod)

	await Promise.all([
		db.collection('test_paging').insertMany([{
			counter: 1,
			myfield1: 'a',
			myfield2: 'b'
		}, {
			counter: 2,
			myfield1: 'a',
			myfield2: 'b'
		}, {
			counter: 3,
			myfield1: 'a',
			myfield2: 'b'
		}, {
			counter: 4,
			myfield1: 'a',
			myfield2: 'b'
		}]),
		db.collection('test_paging_fields').insertOne({
			obj: {
				one: 1,
				two: {
					three: 3
				},
				four: {
					five: {
						six: 6
					},
					seven: 7
				}
			},
			obj2: 1
		})
	])
})

test.beforeEach(async t => {
	t.context.db = await dbUtils.db(mongod)
})

test('should query first few pages', async t => {
	const collection = t.context.db.collection('test_paging')
	const fields = {
		counter: 1,
		myfield1: 1,
		myfield2: 1
	}

	// First page of 2
	let res = await paging.findWithReq({
		query: {
			limit: '2',
			fields: 'counter,myfield1'
		}
	}, collection, {
		fields
	})

	t.is(res.results.length, 2)
	t.deepEqual(res.results[0], {
		counter: 4,
		myfield1: 'a'
	})
	t.deepEqual(res.results[1], {
		counter: 3,
		myfield1: 'a'
	})
	t.is(res.hasPrevious, false)
	t.is(res.hasNext, true)

	// Go forward 1
	res = await paging.findWithReq({
		query: {
			limit: '1',
			next: res.next,
			fields: 'counter,myfield1'
		}
	}, collection, {
		fields
	})
	t.is(res.results.length, 1)
	t.deepEqual(res.results[0], {
		counter: 2,
		myfield1: 'a'
	})
	t.is(res.hasPrevious, true)
	t.is(res.hasNext, true)

	// Now back up 1
	res = await paging.findWithReq({
		query: {
			previous: res.previous,
			limit: '1',
			fields: 'counter,myfield1'
		}
	}, collection, {
		fields
	})

	t.is(res.results.length, 1)
	t.deepEqual(res.results[0], {
		counter: 3,
		myfield1: 'a'
	})
	t.is(res.hasPrevious, true)
	t.is(res.hasNext, true)
})

test('should not query more fields than allowed', async t => {
	const collection = t.context.db.collection('test_paging')
	const res = await paging.findWithReq({
		query: {
			limit: '1',
			// myfield1 will be ignored because it doesn't exist in fields below
			fields: 'counter,myfield1'
		}
	}, collection, {
		projection: {
			counter: 1
		}
	})

	t.is(res.results.length, 1)
	t.deepEqual(res.results[0], {
		counter: 4
	})
})

test('should allow request to specify fields if not otherwise specified', async t => {
	const collection = t.context.db.collection('test_paging')
	const res = await paging.findWithReq({
		query: {
			limit: '1',
			fields: 'counter,myfield1'
		}
	}, collection, {})

	t.is(res.results.length, 1)
	t.deepEqual(res.results[0], {
		counter: 4,
		myfield1: 'a'
	})
})

test('should not allow a limit to be specified that is higher than params.limit', async t => {
	const collection = t.context.db.collection('test_paging')
	const res = await paging.findWithReq({
		query: {
			limit: '2'
		}
	}, collection, {
		limit: 1
	})

	t.deepEqual(res.results.length, 1)
})

test('should handle empty values', async t => {
	const collection = t.context.db.collection('test_paging')
	const res = await paging.findWithReq({
		query: {
			limit: '',
			next: '',
			previous: '',
			fields: ''
		}
	}, collection, {})

	t.is(res.results.length, 4)
	t.truthy(res.results[0]._id)
	t.deepEqual(_.omit(res.results[0], '_id'), {
		counter: 4,
		myfield1: 'a',
		myfield2: 'b'
	})
})

test('should handle bad value for limit', async t => {
	const collection = t.context.db.collection('test_paging')
	const res = await paging.findWithReq({
		query: {
			limit: 'aaa'
		}
	}, collection, {
		projection: {
			counter: 1
		}
	})

	t.is(res.results.length, 4)
	t.deepEqual(res.results[0], {
		counter: 4
	})
})

test('should pick fields', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj.one,obj.four.five'
		}
	}, collection, {
		projection: {
			obj: 1,
			obj2: 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			one: 1,
			four: {
				five: {
					six: 6
				}
			}
		}
	})
})

test('should work without fields', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj.one,obj.four.five'
		}
	}, collection, {})

	t.deepEqual(res.results[0], {
		obj: {
			one: 1,
			four: {
				five: {
					six: 6
				}
			}
		}
	})
})

test('should pick fields when nested', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj.four.five'
		}
	}, collection, {
		projection: {
			'obj.four': 1,
			obj2: 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			four: {
				five: {
					six: 6
				}
			}
		}
	})
})

test('should disallow properties that are not defined', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj.four.five,obj2'
		}
	}, collection, {
		projection: {
			obj: 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			four: {
				five: {
					six: 6
				}
			}
		}
	})
})

test('should pick exact field', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj'
		}
	}, collection, {
		projection: {
			obj: 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			one: 1,
			two: {
				three: 3
			},
			four: {
				five: {
					six: 6
				},
				seven: 7
			}
		}
	})
})

test('should pick exact subfields', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj.one,obj.four.five'
		}
	}, collection, {
		projection: {
			'obj.one': 1,
			'obj.four.five': 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			one: 1,
			four: {
				five: {
					six: 6
				}
			}
		}
	})
})

test('should not allow a broader scoping of fields', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj'
		}
	}, collection, {
		projection: {
			'obj.one': 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			one: 1
		}
	})
})

test('should not allow a broader scoping of subfields', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj.two,obj.four,obj2'
		}
	}, collection, {
		projection: {
			'obj.two.three': 1,
			'obj.four.five': 1,
			obj2: 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			two: {
				three: 3
			},
			four: {
				five: {
					six: 6
				}
			}
		},
		obj2: 1
	})
})

test('--> should pick exact subfields', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: 'obj.one'
		}
	}, collection, {
		projection: {
			'obj.one': 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			one: 1
		}
	})
})

test('--> fields array', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	const res = await paging.findWithReq({
		query: {
			fields: ['obj.one']
		}
	}, collection, {
		projection: {
			'obj.one': 1
		}
	})

	t.deepEqual(res.results[0], {
		obj: {
			one: 1
		}
	})
})

test('invalid fields', async t => {
	const collection = t.context.db.collection('test_paging_fields')
	let error
	error = await t.throwsAsync(paging.findWithReq({
		query: {
			fields: {xxx: 123}
		}
	}, collection))
	t.is(error.message, 'expected string array or comma-separated string for fields')

	error = await t.throwsAsync(paging.findWithReq({
		query: {
			fields: [{xxx: 123}]
		}
	}, collection))
	t.is(error.message, 'expected string array or comma-separated string for fields')

	error = await t.throwsAsync(paging.findWithReq({
		query: {
			fields: 'user'
		}
	}, collection, {
		projection: {
			email: 1
		}
	}))
	t.is(error.message, 'no valid fields provided')
})

test.after.always(() => {
	mongod.stop()
})
