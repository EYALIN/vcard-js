var assert = require('assert');
var fs = require('fs');
var VCard = require('../index.js');

VCard.debug = function(any){
  if(any instanceof VCard.Item){
    if(/^(photo)$/i.test(any.name) ||  typeof any._origin !== 'string')
      return;

    var vCard = any._vCard;
    var line = any._origin;
    var text = any.toString(vCard.version);
    var json = any.toJSON();

    if(text.toLowerCase() === line.toLowerCase())
      return;

    console.log('\n\nfilename : %s\nversion\t : %s', vCard._filename, vCard.version);
    console.log('origin\t : %s', any._origin);
    console.log('text\t : %s', text);
    console.log('json\t : %j', json);
  }else if(any instanceof VCard){
    if(isNaN(any.version)){
      console.log('\n\nfilename : %s\nversion\t : %s', any._filename, any.version);
    }
  }
};

var dir = '' || __dirname;
fs.readdir(dir, function(err, files){
  if(err)
    throw err;
  for(var i in files)
    (function(file){
    if(/\.vcf$/i.test(file)){
      var filename = dir + '/'+ file;
      VCard.readFile(filename, {
        filter : function(any){
          if(any instanceof VCard){
            return /^(2\.1|3\.0|4\.0)$/.test(any.version);
          }
          return true;
        }
      }, function(err, list, data){
        if(err)
          throw err;
        var jsonStr = JSON.stringify(list, null, '  ');
        var jsonArr = JSON.parse(jsonStr);
        list = VCard.parse(jsonArr);

        list.forEach(function(vCard){
          var version = vCard.find('version')[0].value;
          assert.ok(vCard.remove('version'))
          assert.equal(vCard.add('VERSION:'+version).value, version);
        });

        jsonArr = list.map(function(vCard){
          return vCard.toJSON();
        });

        fs.writeFileSync(filename + '.txt', VCard.serialize(jsonArr));
        fs.writeFileSync(filename + '.json', jsonStr);
      });
    }
    })(files[i]);
});
