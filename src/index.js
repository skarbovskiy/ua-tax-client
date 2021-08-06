const Promise = require('bluebird');
const fetch = require('node-fetch');
const iconv = require('iconv-lite');
const xml2js = require('xml2js');
const { crc32 } = require('crc');

const errors = require('./errors');
const mockService = require('./mock');

const { ProcessingError, TaxFSOfflineError, TaxDocPrepareError } = errors;
const parseXml = Promise.promisify(xml2js.parseString);
const xmlBuilder = new xml2js.Builder({ xmldec: { version: '1.0', encoding: 'windows-1251' } });

const initTaxClient = (
	{ logProvider: log, cryptoProvider: gryada, proxyAgentProvider: proxyAgent, useMockClient = false },
	baseUrl = 'http://80.91.165.208:8609/fs'
) => {
	if (useMockClient) {
		return mockService;
	}
	proxyAgent = proxyAgent || null;
	if (!log?.info || !log?.warn || !log?.error) {
		throw new Error('bad log provider');
	}
	if (!gryada?.removeInternalSign || !gryada?.sign) {
		throw new Error('bad crypto provider');
	}
	let service = {
		sendDoc: async (payload) => {
			let body = null;
			try {
				body = await service.prepareDocBuffer(payload);
			} catch (e) {
				log.warn('tax fs doc preparing error', { error: e.message, stack: e.stack });
				throw new TaxDocPrepareError();
			}
			let response = null;
			let start = Date.now();
			try {
				response = await fetch(`${baseUrl}/doc`, {
					method: 'post',
					agent: proxyAgent,
					body,
					timeout: 10000,
					headers: { 'Content-Type': 'application/octet-stream' }
				});
			} catch (e) {
				log.warn('tax fs doc sending error', { error: e.message, stack: e.stack });
			}
			if (!response || [500, 502, 503].includes(response.status)) {
				throw new TaxFSOfflineError();
			}
			if (response.status !== 200) {
				return parseError(await response.text(), payload, 'doc', start);
			}
			try {
				let buffer = await response.buffer();
				let gryadaRes = await gryada.removeInternalSign(buffer.toString('base64'));
				let decodedBody = iconv.decode(Buffer.from(gryadaRes, 'base64'), 'win1251');
				// prevent xml2js parser from dying on ampersand char
				// there's also an option to set a non-strict mode, but it does not work correctly
				decodedBody = decodedBody.replace(/&/g, '&amp;');
				log.info('tax response', {
					type: 'doc',
					resultStatus: 'success',
					requestBody: JSON.stringify(payload),
					responseBody: decodedBody,
					duration: Date.now() - start
				});
				return parseXml(decodedBody, { explicitArray: false });
			} catch (e) {
				//mimic to tax offline error to allow electronic cash machine to go in offline mode
				log.error('tax fs doc response processing error', { error: e.message, stack: e.stack });
				throw new TaxFSOfflineError();
			}
		},
		sendCommand: async (payload) => {
			let data = await gryada.sign(Buffer.from(JSON.stringify(payload)).toString('base64'));
			let start = Date.now();
			let response = await fetch(`${baseUrl}/cmd`, {
				method: 'post',
				agent: proxyAgent,
				timeout: 5000,
				body: Buffer.from(data, 'base64'),
				headers: { 'Content-Type': 'application/octet-stream' }
			});
			if (response.status === 204) {
				return null;
			}
			if (response.status !== 200) {
				return parseError(await response.text(), payload, 'command', start);
			}
			let res = await response.json();
			log.info('tax response', {
				type: 'command',
				resultStatus: 'success',
				requestBody: JSON.stringify(payload),
				responseBody: JSON.stringify(res),
				duration: Date.now() - start
			});
			return res;
		},
		prepareDocBuffer: async (payload) => {
			let builtXML = xmlBuilder.buildObject(payload);
			let whiteSpaceReplaced = builtXML.replace(/\t|\n|\r/g, '');
			let encodedPayload = iconv.encode(whiteSpaceReplaced, 'win1251');
			let data = await gryada.sign(Buffer.from(encodedPayload).toString('base64'));
			return Buffer.from(data, 'base64');
		},
		calcOfflineTaxNumber: ({
			fiscal_number,
			serial_number,
			offline_session_id,
			offline_seed,
			number,
			date,
			time,
			offline_number,
			prev_doc_hash,
			amount
		}) => {
			let hashString = `${offline_seed},${date},${time},${number},${fiscal_number},${serial_number}`;
			if (amount) {
				hashString += `,${amount}`;
			}
			if (prev_doc_hash) {
				hashString += `,${prev_doc_hash}`;
			}
			let crc = calcCRC(hashString);
			return `${offline_session_id}.${offline_number}.${crc}`;
		},
		sendPackage: async (docs) => {
			let signedDocsBuffers = await Promise.mapSeries(docs, async (buffer) => {
				let lengthBuffer = Buffer.alloc(4);
				lengthBuffer.writeInt32LE(buffer.length, 0);
				return Buffer.concat([lengthBuffer, buffer]);
			});
			let payload = signedDocsBuffers.reduce((res, buffer) => {
				return Buffer.concat([res, buffer]);
			}, Buffer.from(''));
			let data = await gryada.sign(payload.toString('base64'));
			let start = Date.now();
			let response = await fetch(`${baseUrl}/pck`, {
				method: 'post',
				agent: proxyAgent,
				body: Buffer.from(data, 'base64'),
				headers: { 'Content-Type': 'application/octet-stream' }
			});
			if (response.status !== 200) {
				return parseError(await response.text(), null, 'package', start);
			}
			let string = (await response.buffer()).toString();
			log.info('tax response', {
				type: 'package',
				resultStatus: 'success',
				requestBody: null,
				responseBody: string,
				duration: Date.now() - start
			});
			if (string === 'OK') {
				return null;
			}
			return JSON.parse(string);
		}
	};
	return service;

	function parseError(response, payload, type, start) {
		log.info('tax response', {
			type,
			resultStatus: 'error',
			requestBody: JSON.stringify(payload),
			responseBody: response,
			duration: Date.now() - start
		});
		let [firstLine, secondLine, thirdLine] = response.split('\r\n');
		let splittedFirstLine = firstLine.split(' ');
		let errorCode = splittedFirstLine[splittedFirstLine.length - 1];
		let desc = secondLine + ' ' + (thirdLine || '');
		if (!desc) {
			desc = response;
			errorCode = null;
		}
		let err = new ProcessingError(desc);
		err.code = errorCode;
		throw err;
	}
	function calcCRC(string) {
		let s = crc32(string).toString(16);
		//append leading zero to hex number from toString(16)
		s = '00000000'.substr(0, 8 - s.length) + s;
		return Buffer.from(s, 'hex').readUInt32LE() % 10000 || 1;
	}
};

module.exports = {
	initTaxClient,
	errors
};
