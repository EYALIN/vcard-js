//var VCard = require('vcard-js');
var VCard = require('../index');

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
