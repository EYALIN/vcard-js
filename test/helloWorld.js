//var VCard = require('vcard-js');
var VCard = require('../index');

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
