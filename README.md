# Foundation Library
The Foundation Node & browser Library is your gateway to effortless interaction with the Foundation API. Designed with simplicity and efficiency in mind, this library abstracts away the complexity of direct API calls, providing a clean and intuitive interface for developers.

## Installation

```
npm i @teleology/foundation
```

or 

```
yarn add @teleology/foundation
```

## Requirements
- axios ^1.7.2
- websocket ^1.0.35

## Usage Example:
```javascript
const { Foundation } = require('@teleology/foundation');

(async () => {
    const sdk = new Foundation({
        url: 'https://foundation-api.teleology.io',
        apiKey: '<your-api-key>',
        uid: '<global-user-unique-id>'
    })

    sdk.subscribe(console.log)


    console.log('Env is', await sdk.getEnvironment())
    console.log("config", await sdk.getConfiguration())
    console.log("variable is", await sdk.getVariable('variable_name', 'optional-uid-override', '<fallback_value>'))
})();
```
