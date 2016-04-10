var util = require('util');
var fs = require('fs');
var quoted_printable = require('quoted-printable');
var utf8 = require('utf8');

/**
 *
 * @class VCard
 * @version 1.2.1
 * @param {array} lines
 * @param {object} [opt]
 * @param {string} [opt.filename]
 * @param {VCard~filterCb} [opt.filter]
 * @param {VCard~debugCb} [opt.debug]
 *
 */
function VCard(lines, opt){
  opt = opt || {};
  var self = opt.vCard = this;

  /**
 * @member {array} VCard#_origin
 * @protected
 */
  this._origin = lines;

  /**
 *
 * @member {string} VCard#_filename
 * @protected
 */
  this._filename = opt.filename;

  /**
 * @member {string} VCard#version
 */
  this.version = getVersion(lines);
  /**
 * @member {VCard.Item[]} VCard#items
 */
  this.items = [];

  lines.forEach(function(line){
    var item = new VCard.Item(line, opt);
    if(opt.filter){
      if(!opt.filter(item))
        return;
    }
    self.items.push(item);
  });

  (opt.debug || VCard.debug)(self);

  function getVersion(lines){
    var line = find(lines, function(line){
      if(util.isArray(line))
        return /^version$/i.test(line[0]);
      else
        return /^version:/i.test(line);
    });
    if(util.isString(line))
      return line.substr(8);
    else if(util.isArray(line))
      return line[3];
    else
      return null;
  };
}

/**
 *
 * @function VCard#toString
 * @param {object} [opt]
 * @param {string} [opt.version]
 * @param {VCard~filterCb} [opt.filter]
 * @returns {string}
 */
/**
 * @function VCard#toString
 * @param {string} version
 * @returns {string}
 */
VCard.prototype.toString = function(opt){
  opt = opt || {};
  var self  = this;
  var list = [];

  if(util.isString(opt)){
    opt = {
      version : opt
    };
  }

  self.items.forEach(function(item){
      if(/^(begin|end):/i.test(item.name))
        return;
      if(opt.filter){
        if(!opt.filter(item))
          return;
      }
      var line = item.toString(opt);
      line && list.push(line);
  });
  if(list.length){
    list.unshift('BEGIN:VCARD');
    list.push('END:VCARD');
    return list.join(VCard.EOL);
  }
  return '';
};

/**
 * @function VCard#toJSON
 * @returns {array}
 */
VCard.prototype.toJSON = function(){
  var self  = this;
  var list = [];
  self.items.forEach(function(item){
    if(/^(begin|end):/i.test(item.name))
      return;
    list.push(item.toJSON());
  });
  return ['vcard', list];
};

/**
 * @function VCard#find
 * @param {string} name
 * @since 1.2.0
 * @returns {VCard.Item[]}
 */
/**
 * @function VCard#find
 * @param {VCard~filterCb} filter
 * @since 1.2.0
 * @returns {VCard.Item[]}
 */
VCard.prototype.find = function(filter){
  var self = this;
  if(!util.isFunction(filter)){
    var name = filter.toLowerCase();
    filter = function(item){
      return item.name.toLowerCase() === name;
    };
  }
  return self.items.filter(filter);
};

/**
 * @function VCard#add
 * @param {(string|array)} line
 * @since 1.2.0
 * @returns {VCard.Item}
 */
VCard.prototype.add = function(line){
  var self = this;
  var item = new VCard.Item(line, {
    vCard : self
  });
  self.items.push(item);
  return item;
};

/**
 * @function VCard#remove
 * @param {string} name
 * @since 1.2.0
 * @returns {number}
 */
VCard.prototype.remove = function(name){
  var self = this;
  var i = 0, j = 0, item;
  name = name.toLowerCase();
  while(i < self.items.length){
    item = self.items[i];
    if(item.name.toLowerCase() === name){
      self.items.splice(i, 1);
      j++;
    }else{
      i++;
    }
  }
  return j;
};

VCard.VCard = VCard;

/**
 * @constant {string} VCard.EOL
 * @default \r\n
 */
VCard.EOL = '\r\n';

/**
 * @constant {number} VCard.MAX_WIDTH
 * @default 1024
 */
VCard.MAX_WIDTH = 1024;

/**
 * @function VCard.identifyType
 * @param {VCard.Item} item
 * @since 1.2.0
 */
VCard.identifyType = function(item){
  if(item.name === 'LANG'){
    item.type = 'language-tag';
  }else if(item.name === 'REV'){
    item.type = 'timestamp';
  }else if(/^(http|https)\:\/\//i.test(item.value)){
    item.type = 'uri';
  }
};

/**
 * @function VCard.debug
 * @param {*} any
 * @abstract
 */
VCard.debug = function(any){
};

/**
 * @class VCard.Item
 * @param {(string|array)} line
 * @param {object} [opt]
 * @param {VCard} [opt.vCard]
 * @param {VCard~debugCb} [opt.debug]
 */
VCard.Item = function(line, opt){
  opt = opt || {};
  var self = this;

  /**
 * @member {VCard} VCard.Item#_vCard
 * @protected
 */
  this._vCard = opt.vCard;
  /**
 * @member {(string|array)} VCard.Item#_origin
 * @protected
 */
  this._origin = line;

  /**
 * @member {string} VCard.Item#name
 */
  this.name = '';
  /**
 * @member {string} VCard.Item#value
 */
  this.value = '';
  /**
 * @member {object} VCard.Item#params
 */
  this.params = {};
  /**
 * @member {string} VCard.Item#type
 * @default text
 * @since 1.2.0
 */
  this.type = 'text';

  if(!line)
    return;
  else if(util.isString(line))
    parse();
  else if(util.isArray(line))
    init();

  (opt.debug || VCard.debug)(self);

  function parse(){
    var frag = line, results, k, v, i;
    while(frag){
      if(!self.name){
        results = frag.match(/^([\w\-]+)(?=:|;|\r\n|\r|\n)/g);
        if(results){
          self.name = v = results[0];
          frag = frag.substr(v.length);
          continue;
        }
      }

      if(frag.indexOf(':') !== 0){
        frag = frag.replace(/^;/, '');

        results = frag.match(/^([\w\-]+)="/);
        if(results){
          k = results[1];
          frag = frag.substr(k.length + 2);
          i = frag.search(/[^\\]"/);
          if(i !== -1)
            v = frag.substr(0, i + 1);
          else
            v = frag;
          setParams(k, v);
          frag = frag.substr(v.length + 1);
          continue;
        }

        results = frag.match(/^([\w\-]+)=/)
        if(results){
          k = results[1];
          frag = frag.substr(k.length + 1);
          i = frag.search(/[^\\](;|:)/);
          if(i !== -1)
            v = frag.substr(0, i + 1);
          else
            v = frag;
          setParams(k, v);
          frag = frag.substr(v.length);
          continue;
        }
        
        i = frag.search(/[^\\](;|:)/);
        if(i !== -1){
          v = frag.substr(0, i + 1);
          setParams('type', v);
          frag = frag.substr(v.length);
          continue;
        }
      }

      self.value = frag.replace(/^:/, '');
      frag = null;
    }
    VCard.identifyType(self);
  }

  function init(){
    self.name = line[0];
    self.type = line[2];
    self.value = line[3];
    var k, o = line[1];
    for(k in o){
      self.params[k] = o[k];
    }
    self.encode(self.value);
  }

  function setParams(k, v){
    var obj = self.params;
    k = k.toUpperCase();

    if(/^(type)$/i.test(k))
      v = v.split(/\s*,\s*/);

    if(obj.hasOwnProperty(k)){
      if(!util.isArray(obj[k]))
        obj[k] = [obj[k]];

      if(util.isArray(v))
        obj[k] = obj[k].concat(v);
      else
        obj[k].push(v);

      return;
    }
    obj[k] = v;
  }
};

/**
 * @function VCard.Item#toString
 * @param {object} [opt]
 * @param {string} [opt.version]
 * @param {VCard~replaceCb} [opt.replace]
 * @returns {string}
 */
/**
 * @function VCard.Item#toString
 * @param {string} version
 * @returns {string}
 */
VCard.Item.prototype.toString = function(opt){
  opt = opt || {};
  var self = this;
  var line = self.name.toUpperCase(), k, v;
  var value = self.value.toString();

  if(util.isString(opt)){
    opt = {
      version : opt
    };
  }
  var version = opt.version;
  if(!version){
    version = self._vCard ? self._vCard.version : '4.0';
  }

  for(k in self.params){
    v = self.params[k];
    k = k.toUpperCase();

    if(version === '2.1' && /^(type)$/i.test(k)){
      line += ';';
      if(/^(photo)$/i.test(self.name))
        line += k + '=';

      if(util.isArray(v))
        line += v.join(';');
      else
        line += v;
      continue;
    }

    if(/^(impp)$/i.test(self.name)){
      if(util.isArray(v)){
        v.forEach(function(v){
          line += ';' + k + '=' + v;
        });
        continue;
      }
    }
    
    if(k === 'ENCODING'){
      if(/^(BASE64|b)$/.test(v) || /^data\:.+\;base64\,/.test(value)){
        if(version === '2.1')
          v = 'BASE64';
        else if(version === '3.0')
          v = 'b';
        else
          v = '';

        if(v)
          value = value.replace(/^data\:.+\;base64\,/, '');
      }
    }

    v = v.toString();
    if(!v)
      continue;

    if(version >= 4 && /\s/.test(v)){
      line += ';' + k + '="' + v + '"';
      continue;
    }
    
    line += ';' + k + '=' + v;
  }

  if(version < 4)
    value = value.replace(/^geo\:/i, '');

  if(/^version$/i.test(self.name))
    line += ':' + version;
  else if(value)
    line += ':' + value;
  else
    line = '';

  if(line.length > VCard.MAX_WIDTH){
    line = line.replace(/(^.{75})|(.{74})/g, function(v){
      return v + VCard.EOL + ' ';
    });
    line = line.replace(/\s$/, '');
    if(version === '2.1')
      line += VCard.EOL;
  }

  if(opt.replace){
    line = opt.replace(line, self);
  }
  return line;
};

/**
 * @function VCard.Item#toJSON
 * @returns {array}
 */
VCard.Item.prototype.toJSON = function(){
  var self  = this;
  var name = self.name.toLowerCase();
  var type = self.type;
  var value = self.decode();
  var params = {};
  var k, v;
  for(k in self.params){
    v = self.params[k];
    if(/^value$/i.test(k)){
      type = v;
      continue;
    }else if(/^label$/i.test(k) && !value){
      value = v;
    }
    params[k.toLowerCase()] = v;
  }
  switch(type){
    case 'boolean':
      value = value === 'TRUE';
      break;
    case 'integer':
      value = parseInt(value);
      break;
    case 'float':
      value = parseFloat(value);
      break;
  }
  return [name, params, type, value];
};

/**
 * @function VCard.Item#encode
 * @param {string} value
 * @since 1.1.0
 */
VCard.Item.prototype.encode = function(value){
  switch(this.params.ENCODING){
    case 'QUOTED-PRINTABLE':
      this.quotedPrintable(value);
      break;
    case 'BASE64':
    case 'b':
      this.base64(value);
      break;
  }
};

/**
 * @function VCard.Item#decode
 * @returns {string}
 * @since 1.1.0
 */
VCard.Item.prototype.decode = function(){
  switch(this.params.ENCODING){
    case 'QUOTED-PRINTABLE':
      return this.quotedPrintable();
    case 'BASE64':
    case 'b':
      return this.base64();
    default:
      return this.value;
  }
};

/**
 * @function VCard.Item#quotedPrintable
 * @param {string} value
 * @since 1.2.0
 */
/**
 * @function VCard.Item#quotedPrintable
 * @returns {string}
 * @since 1.2.0
 */
VCard.Item.prototype.quotedPrintable = function(value){
  if(value){
    value = utf8.encode(value);
    this.value = quoted_printable.encode(value);
    this.params.CHARSET = 'UTF-8';
    this.params.ENCODING = 'QUOTED-PRINTABLE';
  }else{
    value = quoted_printable.decode(this.value);
    value = utf8.decode(value);
    return value;
  }
};

/**
 * @function VCard.Item#base64
 * @param {string} value
 * @since 1.2.0
 */
/**
 * @function VCard.Item#base64
 * @returns {string}
 * @since 1.2.0
 */
VCard.Item.prototype.base64 = function(value){
  if(value){
    this.value = value;
    this.param.ENCODING = this.param.ENCODING || 'BASE64';
  }else{
    return this.value;
  }
};

/**
 * @function VCard.parse
 * @param {(string|array)} data
 * @param {object} [opt]
 * @param {VCard~filterCb} [opt.filter]
 * @returns {array}
 */
VCard.parse = function(data, opt){
  opt = opt || {};
  var vCards = [], lines, vCard;
  if(util.isString(data)){
    lines = [];
    data = data.replace(/^=/mg, ' ');
    data.split(/(\r\n|\r|\n)(?=\S)/).forEach(function(line){
      line = line.replace(/^item\d+\.|\r\n\s*|\r\s*|\n\s*/g, '');
      if(line){
        switch(line){
        case 'BEGIN:VCARD':
          lines = [];
          break;
        case 'END:VCARD':
          vCard = new VCard(lines, opt);
          if(opt.filter){
            if(!opt.filter(vCard))
              break;
          }
          vCards.push(vCard);
          break;
        default:
          lines.push(line);
        }
      }
    });
  }else if(util.isArray(data)){
    data.forEach(function(arr){
      vCards.push(new VCard(arr[1]));
    });
  }
  return vCards;
};

/**
 * @function VCard.serialize
 * @param {(VCard[]|array)} vCards
 * @param {string} version
 * @returns {string}
 */
/**
 * @function VCard.serialize
 * @param {(VCard[]|array)} vCards
 * @param {object} [opt]
 * @param {VCard~filterCb} [opt.filter]
 * @returns {string}
 */
VCard.serialize = function(vCards, opt){
  opt = opt || {};
  var list = [];
  vCards.forEach(function(vCard){
    if(util.isArray(vCard)){
      vCard = new VCard(vCard[1]);
    }
    if(opt.filter){
      if(!opt.filter(vCard))
        return;
    }
    list.push(vCard.toString(opt));
  });
  return list.join(VCard.EOL);
};

/**
 * @function VCard.readFile
 * @param {string} filename
 * @param {object} [opt]
 * @param {string} [opt.encoding=utf8]
 * @param {VCard~readFileCb} callback
 */
/**
 *
 * @callback VCard~readFileCb
 * @param {?Error} err
 * @param {array} vCards
 * @param {string} data
 */
VCard.readFile = function (filename, opt, callback){
  opt = opt || {};
  if(util.isFunction(opt)){
    callback = opt;
    opt = {};
  }

  fs.readFile(opt.filename = filename, {
    encoding : opt.encoding || 'utf8'
  }, function(err, data){
    var vCards = null;
    if(!err)
      try{
        vCards = VCard.parse(data, opt);
      }catch(e){
        err = e;
      }
      callback(err, vCards, data);
  });
};

function find(arr, predicate){
  if(util.isArray(arr))
    for(var i=0,len=arr.length,o; i<len; i++){
      o = arr[i];
      if(predicate(o))
        return o;
    }
  return undefined;
}

module.exports = VCard;

/**
 * @callback VCard~debugCb
 * @param {*} any
 */

/**
 * @callback VCard~filterCb
 * @param {(VCard|VCard.Item)} any
 * @returns {boolean}
 */

/**
 * @callback VCard~replaceCb
 * @param {string} line
 * @param {VCard.Item} item
 * @returns {string}
 */
