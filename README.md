qb-field
========

[![npm license](https://img.shields.io/npm/l/qb-field.svg)](https://www.npmjs.com/package/qb-field) [![npm version](https://img.shields.io/npm/v/qb-field.svg)](https://www.npmjs.com/package/qb-field) [![npm downloads](https://img.shields.io/npm/dm/qb-field.svg)](https://www.npmjs.com/package/qb-field)

A lightweight, promise based abstraction layer for Quick Base Fields

Written in TypeScript, targets Nodejs and the Browser

This library targets the new RESTful JSON-based API, not the old XML-based API. If you want to use the old XML-based API, then please use [v0.x](https://github.com/tflanagan/node-qb-field/tree/v0.x/) of this library.

```
IE 11 Users, if you are receiving this error:
XMLHttpRequest: Network Error 0x80070005, Access is denied.

This is not a limitation of the library, just how Quick Base's new API works.
In order to use the new RESTful JSON-based API in Internet Explorer, you must
change a security setting:

- Go to Internet Options -> Security -> Custom Level
- Scroll down to and find the "Miscellaneous" section
- Ensure "Access data sources across domains" is set to "Enable"
- Click "OK", "Yes", "OK"
```

Install
-------
```
# Install
$ npm install --save qb-field
```

Documentation
-------------

[TypeDoc Documentation](https://tflanagan.github.io/node-qb-field/)

Server-Side Example
-------------------
```typescript
import { QBField } from 'qb-field';
import { QuickBase } from 'quickbase';

const quickbase = new QuickBase({
    realm: 'www',
    userToken: 'xxxxxx_xxx_xxxxxxxxxxxxxxxxxxxxxxxxxx'
    // Use tempToken if utilizing an authentication token sent
    // up from client-side code. If possible, this is preferred.
    // tempToken: 'xxxxxx_xxx_xxxxxxxxxxxxxxxxxxxxxxxxxx'
});

const qbField = new QBField({
	quickbase: quickbase,
	dbid: 'xxxxxxxxx',
	fid: 6
});

(async () => {
    try {
        const results = await qbField.load();

        console.log(qbField.get('label'), results.label);
    }catch(err){
        console.error(err);
    }
})();
```

Client-Side Example
-------------------
Import `QBField` by loading `qb-field.browserify.min.js`

```javascript
var quickbase = new QuickBase({
    realm: 'www'
});

var qbField = new QBField({
	quickbase: quickbase,
	dbid: 'xxxxxxxxx',
	fid: 6
});

// Using a Temporary Token
quickbase.getTempTokenDBID({
    dbid: 'xxxxxxxxx'
}).then(function(results){
    return qbField.load();
}).then(function(results){
    console.log(qbField.get('label'), results.label);
}).catch(function(err){
    console.error(err);
});
```

License
-------
Copyright 2019 Tristian Flanagan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
