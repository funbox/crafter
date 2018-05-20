const fs = require('fs');
const Crafter = require('./Crafter.js');

const files = fs.readdirSync('./fixtures');

const apibRegex = /\.apib$/;

files.forEach(f => {
  if (apibRegex.exec(f)) {
    console.log(`=== ${f} ===`);
    const data = fs.readFileSync(`./fixtures/${f}`, {encoding: 'utf-8'});
    const result = Crafter.parse(data);
    console.log(JSON.stringify(result, null, 2));
    console.log('-------');
  }
});