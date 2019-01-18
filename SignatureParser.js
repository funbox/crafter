const typeAttributes = {
  required: 'required',
  optional: 'optional',
  fixed: 'fixed',
  'fixed-type': 'fixedType',
  nullable: 'nullable',
};

const fakeTypeAttributes = { sample: 'sample' };

const parserTraits = {
  NAME: 'NAME',
  VALUE: 'VALUE',
  ATTRIBUTES: 'ATTRIBUTES',
  DESCRIPTION: 'DESCRIPTION',
};

parserTraits.all = Object.values(parserTraits);


const VALUES_DELIMITER = ':';
const ATTRIBUTES_BEGIN_DELIMITER = '(';
const DESCRIPTION_DELIMITER = '-';

class SignatureParser {
  constructor(origSignature, traits = parserTraits.all) {
    this.traits = traits;
    this.attributes = [];
    this.typeAttributes = [];
    this.type = null;
    this.isSample = false;
    this.warnings = [];

    const [inlinePart, ...rest] = origSignature.split('\n');

    let signature = inlinePart;

    this.rest = rest.join('\n');

    if (this.traits.includes(parserTraits.NAME)) {
      signature = this.extractName(signature);

      if (!this.name) {
        this.warnings.push(`No name specified: "${origSignature}"`);
      }
    }

    if (this.traits.includes(parserTraits.VALUE)) {
      if (!this.traits.includes(parserTraits.NAME)) {
        signature = VALUES_DELIMITER + signature;
      }

      if (signature[0] === VALUES_DELIMITER) {
        signature = this.extractValue(signature);

        if (!this.value) {
          this.warnings.push(`No value(s) specified: "${origSignature}"`);
        }
      }
    }

    if (this.traits.includes(parserTraits.ATTRIBUTES)) {
      signature = this.extractAttributes(signature);
    }

    if (this.traits.includes(parserTraits.DESCRIPTION)) {
      this.extractDescription(signature);
      signature = '';
    }

    if (this.isSample && !this.value) {
      this.warnings.push(`no value present when "sample" is specified: "${origSignature}"`);
    }

    if (signature) {
      error(origSignature);
    }
  }

  extractName(signature) {
    let i = 0;
    let name = '';

    while (i < signature.length) {
      if (signature[i] === '`') {
        const result = retrieveEscaped(signature, i);
        if (result.result) {
          name = `${name}${result.result}`;
          signature = result.str;
          i = 0;
        } else {
          name = `${name}${signature[i]}`;
          i++;
        }
      } else if (
        this.traits.includes(parserTraits.VALUE) && signature[i] === VALUES_DELIMITER
        || this.traits.includes(parserTraits.ATTRIBUTES) && signature[i] === ATTRIBUTES_BEGIN_DELIMITER
        || this.traits.includes(parserTraits.DESCRIPTION) && signature[i] === DESCRIPTION_DELIMITER
      ) {
        break;
      } else {
        name = `${name}${signature[i]}`;
        i++;
      }
    }

    this.name = stripBackticks(name.trim());

    return signature.substr(i);
  }

  extractValue(signature) {
    signature = signature.trim();
    if (signature[0] === VALUES_DELIMITER) {
      signature = signature.slice(1).trim();
    }

    let i = 0;
    let value = '';

    while (i < signature.length) {
      if (signature[i] === '`') {
        const result = retrieveEscaped(signature, i);
        if (result.result) {
          value = `${value}${result.result}`;
          signature = result.str;
          i = 0;
        } else {
          i++;
        }
      } else if (
        this.traits.includes(parserTraits.ATTRIBUTES) && signature[i] === ATTRIBUTES_BEGIN_DELIMITER
        || this.traits.includes(parserTraits.DESCRIPTION) && signature[i] === DESCRIPTION_DELIMITER
      ) {
        break;
      } else {
        value = `${value}${signature[i]}`;
        i++;
      }
    }

    this.value = stripBackticks(value.trim());

    return signature.substr(i);
  }

  extractAttributes(signature) {
    signature = signature.trim();

    if (signature[0] === VALUES_DELIMITER) {
      signature = signature.substr(1).trim();
    }

    if (signature[0] !== '(') {
      return signature;
    }

    const matchData = /^\(([^)]+)\)/.exec(signature);

    if (!matchData) error(signature);

    this.attributes = matchData[1].split(/,(?![^[\]]*])/).map(a => a.trim());

    this.attributes.forEach((a) => {
      if (Object.keys(typeAttributes).indexOf(a) !== -1) {
        this.typeAttributes.push(typeAttributes[a]);
      } else if (!this.type) {
        this.type = a;
      } else if (a !== fakeTypeAttributes.sample) {
        error(a);
      }
    });

    this.isSample = this.attributes.some(a => a === fakeTypeAttributes.sample);

    return signature.slice(matchData[0].length);
  }

  extractDescription(signature) {
    signature = signature.trim();

    if (signature[0] === DESCRIPTION_DELIMITER) {
      signature = signature.substr(1).trim();
    }

    this.description = signature;
  }
}

function retrieveEscaped(str, startPos) {
  let levels = 0;
  const escapeChar = str[startPos];

  while (str[startPos + levels] === escapeChar) {
    levels++;
  }

  const borderChars = str.substr(startPos, levels);
  const endPos = str.substr(startPos + levels).indexOf(borderChars);

  if (endPos === -1) {
    return {
      str,
      result: '',
    };
  }

  const result = str.substr(startPos, startPos + endPos + levels * 2);
  str = str.substr(startPos + result.length);

  return {
    str,
    result,
  };
}

function splitValues(values) {
  if (typeof values !== 'string') {
    return [values];
  }
  const hasEscapedValue = /`.+`/.test(values);
  const splitter = hasEscapedValue ? /(`.+`),/ : ',';
  const splitted = values.split(splitter)
    .filter(val => !!val)
    .map(val => (val.startsWith('`') ? val : val.replace(',', '')))
    .map(val => stripBackticks(val.trim()));

  return splitted;
}

function stripBackticks(str) {
  while (str[0] === '`' && str[str.length - 1] === '`') {
    str = str.substr(1, str.length - 2);
  }

  return str.trim();
}

function error(sig) {
  throw new Error(`Invalid signature: ${sig}`);
}

module.exports = {
  parser: SignatureParser,
  traits: parserTraits,
  splitValues,
};
