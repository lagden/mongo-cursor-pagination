'use strict'

const EJSON = require('mongodb-extjson')

function encode(obj) {
	return encodeURIComponent(Buffer.from(EJSON.stringify(obj, {relaxed: true}), 'utf8').toString('base64'))
}

function decode(str) {
	return EJSON.parse(Buffer.from(decodeURIComponent(str), 'base64').toString('utf8'), {relaxed: true})
}

exports.encode = encode
exports.decode = decode
