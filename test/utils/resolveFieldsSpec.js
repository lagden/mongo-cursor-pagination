'use strict'

import test from 'ava'
import resolveFields from '../../src/utils/resolveFields'

test('throws', t => {
	let error
	error = t.throws(() => {
		resolveFields('xxx')
	}, TypeError)
	t.is(error.message, 'expected nullable array for desiredFields')

	error = t.throws(() => {
		resolveFields(null, 'xxx')
	}, TypeError)
	t.is(error.message, 'expected nullable plain object for allowedFields')

	error = t.throws(() => {
		resolveFields(null, null, 'xxx')
	}, TypeError)
	t.is(error.message, 'expected optional plain object for overrideFields')

	error = t.throws(() => {
		resolveFields([], {user: false})
	}, TypeError)
	t.is(error.message, 'projection includes exclusion, but we do not support that')
})

test('should support empty fields', t => {
	t.deepEqual(resolveFields(), {})
	t.deepEqual(resolveFields([]), {})
	t.deepEqual(resolveFields([], null), {})
	t.deepEqual(resolveFields([], null, {}), {})
	t.deepEqual(resolveFields([], {}), null)
	t.deepEqual(resolveFields([], {}, {}), null)
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
