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

var list = VCard.parse(lines.join(VCard.EOL));
list.forEach(function(card){
  card.items.forEach(function(item){
    console.log(item.name +'='+ item.decode());
  });
});

var jCard = JSON.stringify(list, null, '  ');
console.log(jCard);

var vCard = VCard.serialize(list);
console.log(vCard);
