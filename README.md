# vcard-js

## Description

`vcard-js` is a library to deal with the vCard format.
It can parse from vCard format to jCard format,
and transform current version to other version.

## Installation

```
npm install vcard-js
```

## Usage

```js
var VCard = require('vcard-js');

var lines = [
  'BEGIN:VCARD',
  'VERSION:2.1',
  'N:Einstein',
  'FN:Albert Einstein',
  'TEL:(111) 555-6666',
  'END:VCARD'
];

var jCard = VCard.parse(lines.join(VCard.EOL));
console.log(JSON.stringify(jCard, null, '  '));

var vCard = VCard.serialize(jCard);
console.log(vCard);
```

## API

### Classes

#### VCard

* `VCard.parse(data[,opt])`
* `VCard.serialize(vCards[,opt])`
* `VCard.readFile(filename[,opt],callback)`
* `VCard#EOL`
* `VCard#MAX_WIDTH`
* `VCard#items`
* `VCard#toJSON()`
* `VCard#toString([opt])`
* `VCard#toString(version)`

#### VCard.Item

* `VCard.Item#name`
* `VCard.Item#params`
* `VCard.Item#value`
* `VCard.Item#encode(value)`
* `VCard.Item#decode()`
* `VCard.Item#toJSON()`
* `VCard.Item#toString([opt])`
* `VCard.Item#toString(version)`

You can output the detail documentation by [jsdoc](https://github.com/jsdoc3/jsdoc) command.

```
jsdoc -R README.md lib/
```

## References

* [Wikipedia](https://en.wikipedia.org/wiki/VCard)
* [IANA](http://www.iana.org/assignments/vcard-elements/vcard-elements.xhtml)
