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

var str = [
  'BEGIN:VCARD',
  'VERSION:2.1',
  'N:Einstein',
  'FN:Albert Einstein',
  'TEL:(111) 555-6666',
  'END:VCARD'
].join(VCard.EOL);

var arr = VCard.parse(str);

console.log(VCard.serialize(arr));
console.log(VCard.serialize(arr, '3.0'));

arr.forEach(function(vCard){
  console.log(vCard.toString('4.0'));
  console.log(vCard.toJSON());
});
```

## API

### Classes

#### VCard

* `VCard.EOL`
* `VCard.MAX_WIDTH`
* `VCard.parse(data[,opt])`
* `VCard.serialize(vCards,version)`
* `VCard.serialize(vCards[,opt])`
* `VCard.readFile(filename[,opt],callback)`
* `VCard.identifyType(item)`
* `VCard#items`
* `VCard#toJSON()`
* `VCard#toString(version)`
* `VCard#toString([opt])`
* `VCard#find(name)`
* `VCard#find(filter)`
* `VCard#add(line)`
* `VCard#remove(name)`

#### VCard.Item

* `VCard.Item#name`
* `VCard.Item#params`
* `VCard.Item#dataType`
* `VCard.Item#value`
* `VCard.Item#encode(value)`
* `VCard.Item#decode()`
* `VCard.Item#quotedPrintable([value])`
* `VCard.Item#base64([value])`
* `VCard.Item#toJSON()`
* `VCard.Item#toString(version)`
* `VCard.Item#toString([opt])`

You can output the detail documentation by [jsdoc](https://github.com/jsdoc3/jsdoc) command.

```
jsdoc -R README.md lib/
```

## References

* [Wikipedia](https://en.wikipedia.org/wiki/VCard)
* [IANA](http://www.iana.org/assignments/vcard-elements/vcard-elements.xhtml)

## License

ISC
