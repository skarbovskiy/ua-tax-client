module.exports = {
	rules: {
		'max-len': [2, { code: 120, tabWidth: 2 }],
		indent: [2, 'tab', { SwitchCase: 1, offsetTernaryExpressions: true }],
		'no-nested-ternary': [2],
		quotes: [2, 'single', { allowTemplateLiterals: true, avoidEscape: true }],
		'linebreak-style': [2, 'unix'],
		'no-unused-vars': [2, { vars: 'all', args: 'none' }],
		'comma-dangle': [
			'error',
			{
				arrays: 'never',
				objects: 'never',
				imports: 'never',
				exports: 'never',
				functions: 'never'
			}
		],
		'eol-last': [2],
		'no-multiple-empty-lines': [2, { max: 1, maxEOF: 1 }],
		'no-trailing-spaces': [2],
		'no-extra-parens': [2, 'functions'],
		'comma-spacing': [2],
		'space-infix-ops': [2],
		'space-before-blocks': [2, 'always'],
		'space-before-function-paren': [
			'error',
			{
				anonymous: 'always',
				named: 'never',
				asyncArrow: 'always'
			}
		],
		'key-spacing': [2],
		'keyword-spacing': [2],
		curly: [2],
		'brace-style': [2],
		semi: ['error', 'always'],
		eqeqeq: 1, // ===
		'no-mixed-operators': 2, // + *
		'class-methods-use-this': 2,
		'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
		'no-restricted-syntax': 2, // for in
		'guard-for-in': 2, // for in
		'prefer-destructuring': 1,
		'no-console': 2,
		'no-restricted-globals': 2, // isNaN
		'one-var': ['error', 'never'],
		'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 1,
		'arrow-parens': ['error', 'always'],
		'object-curly-spacing': ['error', 'always'],
		'array-bracket-spacing': ['error', 'never'],
		'computed-property-spacing': ['error', 'never'],
		'prettier/prettier': [
			'error',
			{
				useTabs: true,
				trailingComma: 'none',
				singleQuote: true,
				printWidth: 120,
				tabWidth: 2,
				arrowParens: 'always'
			}
		]
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020
	},
	env: {
		es2020: true,
		node: true
	},
	extends: [
		'eslint:recommended',
		'plugin:prettier/recommended',
		'plugin:security/recommended',
		'plugin:node/recommended'
	],
	plugins: ['security', 'node', 'prettier']
};
