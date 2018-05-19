const fs = require('fs');
const util = require('util');
const Crafter = require('./Crafter.js');

const files = fs.readdirSync('./fixtures');

const apibRegex = /\.apib$/;

files.forEach(f => {
  if (apibRegex.exec(f)) {
    console.log(`=== ${f} ===`);
    const data = fs.readFileSync(`./fixtures/${f}`, {encoding: 'utf-8'});
    const result = Crafter.parse(data);
    console.log(util.inspect(result, {depth: null}));
    console.log('-------');
  }
});