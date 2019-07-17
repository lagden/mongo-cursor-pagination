'use strict'

function getPropertyViaDotNotation(propertyName, object) {
	const parts = propertyName.split('.')

	let prop = object
	for (const part of parts) {
		prop = prop[part]
	}
	return prop
}

module.exports = getPropertyViaDotNotation
