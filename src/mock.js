module.exports = {
	sendDoc: async () => {
		return {
			TICKET: {
				$: {
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:noNamespaceSchemaLocation': 'ticket01.xsd'
				},
				UID: '9CA694BE-6BB2-43CA-A7CE-729EAF960C7D',
				ORDERDATE: '18052021',
				ORDERTIME: '152716',
				ORDERNUM: '17',
				ORDERTAXNUM: '9668935',
				OFFLINESESSIONID: '28000',
				OFFLINESEED: '494794570059162',
				ERRORCODE: '0',
				VER: '1'
			}
		};
	},
	sendCommand: async () => null,
	prepareDocBuffer: async () => Buffer.alloc(1),
	calcOfflineTaxNumber: () => '1.1.1',
	sendPackage: async () => null
};
