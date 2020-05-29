/* eslint unicorn/no-useless-undefined: 0 */

'use strict'

const test = require('ava')
const resolveFields = require('../../src/utils/resolveFields')

test('throws', t => {
	t.throws(() => {
		resolveFields('xxx')
	}, {instanceOf: TypeError, message: 'expected nullable array for desiredFields'})

	t.throws(() => {
		resolveFields(undefined, 'xxx')
	}, {instanceOf: TypeError, message: 'expected nullable plain object for allowedFields'})

	t.throws(() => {
		resolveFields(undefined, undefined, 'xxx')
	}, {instanceOf: TypeError, message: 'expected optional plain object for overrideFields'})

	t.throws(() => {
		resolveFields([], {user: false})
	}, {instanceOf: TypeError, message: 'projection includes exclusion, but we do not support that'})
})

test('should support empty fields', t => {
	t.deepEqual(resolveFields(), {})
	t.deepEqual(resolveFields([]), {})
	t.deepEqual(resolveFields([], undefined), {})
	t.deepEqual(resolveFields([], undefined, {}), {})
	t.deepEqual(resolveFields([], {}), undefined)
	t.deepEqual(resolveFields([], {}, {}), undefined)
})

test('should support default fields', t => {
	const fields = {'users.id': 1, 'users.email': 1, 'users.services.google.token': 1, extra: 1}
	const fieldsMinusId = Object.assign({_id: 0}, fields)
	const fieldsPlusId = Object.assign({_id: 1}, fields)
	t.deepEqual(resolveFields([], fields), fieldsMinusId)
	t.deepEqual(resolveFields([], fieldsMinusId), fieldsMinusId)
	t.deepEqual(resolveFields([], fieldsPlusId), fieldsPlusId)
})

test('should let override disable the id field', t => {
	const fields = {'users.id': 1, 'users.email': 1, 'users.services.google.token': 1, extra: 1}
	const fieldsMinusId = Object.assign({_id: 0}, fields)
	const fieldsPlusId = Object.assign({_id: 1}, fields)
	t.deepEqual(resolveFields([], fieldsPlusId, {_id: 0}), fieldsMinusId)
})

test('should select fields', t => {
	const fields = {'users.id': 1, 'users.email': 1, 'users.services.google.token': 1, extra: 1}
	const fieldsPlusId = Object.assign({_id: 1}, fields)
	t.deepEqual(resolveFields(['_id', 'users.services.google.token'], fields), {_id: 0, 'users.services.google.token': 1})
	t.deepEqual(resolveFields(['_id', 'users.services.google.token'], fieldsPlusId), {_id: 1, 'users.services.google.token': 1})
	t.deepEqual(resolveFields(['users.services.google.token'], fields), {_id: 0, 'users.services.google.token': 1})
	t.deepEqual(resolveFields(['users'], fields), {_id: 0, 'users.id': 1, 'users.email': 1, 'users.services.google.token': 1})
	t.deepEqual(resolveFields(['users'], fieldsPlusId), {_id: 0, 'users.id': 1, 'users.email': 1, 'users.services.google.token': 1})
})

test('should add fields from the override', t => {
	const fields = {'users.id': 1, 'users.email': 1, 'users.services.google.token': 1, extra: 1}
	t.deepEqual(resolveFields(['_id', 'users'], fields, {another: 1}), {_id: 0, 'users.id': 1, 'users.email': 1, 'users.services.google.token': 1, another: 1})
})
