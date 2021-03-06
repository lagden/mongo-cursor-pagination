'use strict'

module.exports = {
	env: {
		node: true
	},
	extends: [
		'xo',
		'plugin:unicorn/recommended'
	],
	rules: {
		indent: ['error', 'tab'],
		'linebreak-style': ['error', 'unix'],
		quotes: ['error', 'single'],
		semi: ['error', 'never'],
		'semi-spacing': [
			'error',
			{
				before: false,
				after: true
			}
		],
		'valid-jsdoc': 0,
		'no-console': 0,
		camelcase: 0,
		'capitalized-comments': 0,
		'spaced-comment': 0,
		'require-atomic-updates': 0,
		'unicorn/filename-case': 0,
		'unicorn/prevent-abbreviations': 0,
		'padding-line-between-statements': 0,
		'unicorn/no-fn-reference-in-iterator': 0
	}
}
