# UA tax server client

Node.js module that provides an instantiable client-interface for communicating with [ukrainian tax fiscalization server](https://tax.gov.ua/baneryi/programni-rro/opis-ari-fiskalnogo-servera-kontrolyuyuchogo-organu/opis-ari-fiskalnogo-servera-kontrolyuyuchogo-organu/).

This module doesn't do any type conversions. It uses xml-parser for conversion between objects and the XML code the API communicates with. The simple types in the type definitions are based on the expected behaviour. All the exact format-constraints can be found in the official documentations.

## Setup
```js
const { initTaxClient, errors } = require('ua-tax-client');

//your ukrainian crypto provider wrapper (jkurwa, iit lib etc)
const crypto = {
  /**
  * @param {string} payload - base64 string
  * @return {Promise(string)} original data with sign included
  */
  sign: (payload) => {},

  /**
  * @param {string} payload - base64 string
  * @return {Promise(string)} original data without internal sign
  */
  removeInternalSign: (payload) => {}
}

const client = initTaxClient({ logProvider: console, cryptoProvider: crypto });
```

## Optional proxy provider
```js
const HttpProxyAgent = require('http-proxy-agent');
const { initTaxClient, errors } = require('ua-tax-client');

const service = initTaxClient({
  logProvider: console,
  cryptoProvider: crypto,
  proxyProvider: new HttpProxyAgent('http://10.1.1.1:3128')
});
```

## Optional mock service

Module can export mocked service for e2e/integration purposes.
```js
const { initTaxClient } = require('ua-tax-client');
const service = initTaxClient({ useMockClient: true });
```

## Usage
```js
async function main() {
  const client = initTaxClient({ logProvider: console, cryptoProvider: crypto });
  let ticketResponse = await client.sendDoc({
    CHECK: {
      $: {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': 'check01.xsd'
      },
      CHECKHEAD: {
        DOCTYPE: '101',
        UID: '11111-1111-11111',
        TIN: '34554362',
        IPN: '123456789019',
        ORGNM: 'Тестовий платник 3',
        POINTNM: 'Тестовий платник 3',
        POINTADDR: 'УКРАЇНА, ОДЕСЬКА ОБЛАСТЬ, М.БІЛГОРОД-ДНІСТРОВСЬКИЙ, СМТ.ЗАТОКА вул Приморська 32',
        ORDERDATE: '20062020',
        ORDERTIME: '202020',
        ORDERNUM: 1,
        CASHDESKNUM: 2,
        CASHREGISTERNUM: '4000094201',
        CASHIER: 'А А А',
        VER: '1'
      }
    }
  });

  let commandResponse = await client.sendCommand({
    Command: 'TransactionsRegistrarState',
    NumFiscal: '4000094201'
  });

  /**
  * @param {array} documents - array of buffers (presigned offline docs ready to be sent to tax)
  */
  let pkgResponse = await client.sendPackage([Buffer.from('')]);
}
```

## Error handling

For possible errors see `./src/errors.js`

```js
const { initTaxClient, errors } = require('ua-tax-client');
const client = initTaxClient({...});
try {
  var ticketResponse = await client.sendDoc({...});
} catch (e) {
  if (e instanceof errors.TaxFSOfflineError) {
    //initiate offline mode logic
  }
}
```
