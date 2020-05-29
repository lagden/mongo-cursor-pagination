'use strict'

const _ = require('lodash')
const resolveFields = require('./resolveFields')

/**
 * Normalize the given query parameter to an array, so we support both param=a,b and
 * param[]=a&param[]=b.
 *
 * @param {Object} query The parsed query object containing the given parameter.
 * @param {String} param The parameter to normalize.
 * @returns {String[]} The normalized array from the given query parameter.
 * @throws {TypeError} When the query parameter isn't a string, an empty value, or an array of
 *   strings.
 */
function normalizeQueryArray(query, param) {
	const value = query[param]
	if (Array.isArray(value)) {
		for (const v of value) {
			if (!_.isString(v)) {
				throw new TypeError('expected string array or comma-separated string for ' + param)
			}
		}
		return value
	}
	// This goes before _.isString so we don't split an empty string into ['']. The array option just
	// uses whatever the user provides.
	if (_.isEmpty(value)) {
		return []
	}
	if (_.isString(value)) {
		return value.split(',')
	}
	throw new TypeError('expected string array or comma-separated string for ' + param)
}

/**
 * Sanitizes a `query` object received and merges it's changes to an optional `params` object
 *
 * @param {Object} query An object with the following properties:
 *    -limit: If a numeric string, use it as the limit. If limit also passed in params
 *      then this value cannot exceed it.
 *    -next: If a non-empty string, use it as the next cursor.
 *    -previous: If a non-empty string, use it as the previous cursor.
 *    -projection: If a non-empty string, used to limit fields that are returned. Multiple fields
 *      can be specified as a comma-delimited list. If field name used is not in params.projection,
 *      it will be ignored.
 * @param {Object} params See documentation for `find()`, plus these options:
 *    -overrideprojection: an object containing fields that should override fields from the querystring, e.g.
 *      {_id: 0} or {internalField: 1}. We only support field exclusion for _id, as we expect whitelists
 *      for fields from both params.projection and params.overrideFields.
 * @return {Object} query params
 */
function sanitizeQuery(query, params = {}) {
	if (!_.isEmpty(query.limit)) {
		const limit = Number.parseInt(query.limit, 10)
		// Don't let the user specify a higher limit than params.limit, if defined.
		if (!Number.isNaN(limit) && (!params.limit || params.limit > limit)) {
			params.limit = limit
		}
	}

	if (!_.isEmpty(query.next)) {
		params.next = query.next
	}

	if (!_.isEmpty(query.previous)) {
		params.previous = query.previous
	}

	// Don't trust fields passed in the querystring, so whitelist them against the fields defined in
	// parameters.
	const fields = resolveFields(normalizeQueryArray(query, 'fields'), params.projection, params.overrideFields)
	if (fields === undefined) {
		throw new TypeError('no valid fields provided')
	}

	// Set fields to undefined if it's empty to avoid adding _id: 0 in find.
	params.projection = _.isEmpty(fields) ? undefined : fields

	return params
}

module.exports = sanitizeQuery
