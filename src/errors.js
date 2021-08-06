class ProcessingError extends Error {
	constructor(message, params) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class TaxFSOfflineError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class TaxDocPrepareError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = {
	ProcessingError,
	TaxFSOfflineError,
	TaxDocPrepareError
};
