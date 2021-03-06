const utils = require('./utils');
const {
  typeAttributes,
  parameterizedTypeAttributes,
  fakeTypeAttributes,
} = require('./type-attributes');
/**
 * @typedef {('NAME'|'VALUE'|'ATTRIBUTES'|'DESCRIPTION')} ParserTrait
 */
const parserTraits = {
  NAME: 'NAME',
  VALUE: 'VALUE',
  ATTRIBUTES: 'ATTRIBUTES',
  DESCRIPTION: 'DESCRIPTION',
};

parserTraits.all = Object.values(parserTraits);

const VALUES_DELIMITER = ':';
const ATTRIBUTES_BEGIN_DELIMITER = '(';
const ATTRIBUTES_END_DELIMITER = ')';
const ATTRIBUTES_COMMA_DELIMITER = ',';
const DESCRIPTION_DELIMITER = '-';

class SignatureParser {
  /**
   * @param {string} origSignature
   * @param {boolean} languageServerMode
   * @param {ParserTrait[]} traits
   */
  constructor(origSignature, languageServerMode, traits = parserTraits.all) {
    this.languageServerMode = languageServerMode;
    this.traits = traits;
    this.typeAttributes = [];
    this.typeAttributesOffsetsAndLengths = [];
    this.type = null;
    this.typeOffset = null;
    this.isSample = false;
    this.isDefault = false;
    this.warnings = [];

    const [inlinePart, ...rest] = origSignature.split('\n');

    let signature = inlinePart;
    let signatureOffset = 0;

    this.rest = rest.join('\n');

    if (this.traits.includes(parserTraits.NAME)) {
      [signature, signatureOffset] = this.extractName(signature);

      if (!this.name) {
        this.warnings.push(`No name specified: "${origSignature}"`);
      }
    }

    if (this.traits.includes(parserTraits.VALUE)) {
      if (signature[0] === VALUES_DELIMITER) {
        [signature, signatureOffset] = this.extractValue(signature, signatureOffset);

        if (!this.value && !this.rawValue) {
          this.warnings.push(`No value(s) specified: "${origSignature}"`);
        }
      } else {
        [signature, signatureOffset] = this.extractValue(signature, signatureOffset);
      }
    }

    if (this.traits.includes(parserTraits.ATTRIBUTES)) {
      [signature, signatureOffset] = this.extractAttributes(signature, signatureOffset);
    }

    if (this.traits.includes(parserTraits.DESCRIPTION)) {
      this.extractDescription(signature, signatureOffset);

      if (!this.name && !this.value && !this.type && this.typeAttributes.length === 0 && this.description) {
        this.warnings.push(`No value(s) specified: "${origSignature}"`);
      }

      signature = '';
    }

    if (this.isSample && !this.value) {
      this.warnings.push(`no value present when "sample" is specified: "${origSignature}"`);
    }

    if (signature && !this.languageServerMode) {
      error(origSignature);
    }
  }

  extractName(signature) {
    const origSignature = signature;
    let i = 0;
    let name = '';
    let inProgress = false;

    while (i < signature.length) {
      if (
        (this.traits.includes(parserTraits.VALUE) && signature[i] === VALUES_DELIMITER
        || this.traits.includes(parserTraits.ATTRIBUTES) && signature[i] === ATTRIBUTES_BEGIN_DELIMITER
        || this.traits.includes(parserTraits.DESCRIPTION) && signature[i] === DESCRIPTION_DELIMITER)
        && !inProgress
      ) {
        break;
      } else {
        if (signature[i] === '`') inProgress = !inProgress;
        name = `${name}${signature[i]}`;
        i++;
      }
    }

    this.name = stripBackticks(name.trim());
    if (this.name) {
      this.nameOffset = origSignature.indexOf(this.name);
    }

    const newSignature = signature.substr(i);
    return [newSignature, origSignature.length - newSignature.length];
  }

  extractValue(origSignature, offset) {
    let signature = origSignature.trim();
    if (signature[0] === VALUES_DELIMITER) {
      signature = signature.slice(1).trim();
    }

    let i = 0;
    let value = '';
    let inProgress = false;

    while (i < signature.length) {
      if (
        (this.traits.includes(parserTraits.ATTRIBUTES) && signature[i] === ATTRIBUTES_BEGIN_DELIMITER
        || this.traits.includes(parserTraits.DESCRIPTION) && signature[i] === DESCRIPTION_DELIMITER)
        && !inProgress
      ) {
        break;
      } else {
        if (signature[i] === '`') inProgress = !inProgress;
        value = `${value}${signature[i]}`;
        i++;
      }
    }

    value = value.trim();

    if (value[0] === '`' && value[value.length - 1] === '`' && !value.slice(1, -1).includes('`')) {
      this.rawValue = value;
      value = stripBackticks(value);
    }

    if (this.rawValue && this.rawValue !== value) {
      this.value = value;
    } else {
      this.value = value || null;
    }

    if (this.value) {
      this.valueOffset = offset + origSignature.indexOf(this.value);
    }

    return [signature.substr(i), offset + origSignature.indexOf(signature) + i];
  }

  extractAttributes(origSignature, origSignatureOffset) {
    let signature = origSignature.trim();
    const signatureOffset = origSignature.indexOf(signature);

    if (signature[0] === VALUES_DELIMITER) {
      signature = signature.substr(1).trim();
    }

    if (signature[0] !== '(') {
      return [signature, origSignatureOffset + signatureOffset];
    }

    const { attributes, offsets, attributeString } = splitAttributes(signature, this.languageServerMode);

    attributes.forEach((a, index) => {
      const isParameterized = a.includes('=');

      let attrName = a;
      let attrValue;

      if (isParameterized) {
        [attrName, attrValue] = a.split(/=(.+)/);

        if (attrValue[0] === '"' && attrValue[attrValue.length - 1] === '"') {
          attrValue = attrValue.substring(1, attrValue.length - 1);

          let escaping = false;
          attrValue = attrValue.split('').reduce((acc, char) => {
            if (char === '\\') {
              if (escaping) {
                acc += char;
              }

              escaping = !escaping;
            } else {
              acc += char;
            }

            return acc;
          }, '');
        }
      }

      if (this.hasTypeAttribute(attrName)) {
        this.warnings.push(`Attribute ${attrName} has been defined more than once.`);
      }

      if (isParameterized && Object.keys(parameterizedTypeAttributes).includes(attrName)) {
        const relevantAttribute = parameterizedTypeAttributes[attrName];
        const { alias, dataType } = relevantAttribute;
        try {
          attrValue = convertValue(attrValue, dataType);
        } catch (e) {
          if (!this.languageServerMode) {
            throw e;
          }
        }
        this.typeAttributes.push([alias, attrValue]);
        this.typeAttributesOffsetsAndLengths.push([origSignatureOffset + signatureOffset + offsets[index], a.length]);
      } else if (!isParameterized && Object.keys(typeAttributes).includes(attrName)) {
        this.typeAttributes.push(typeAttributes[a]);
        this.typeAttributesOffsetsAndLengths.push([origSignatureOffset + signatureOffset + offsets[index], a.length]);
      } else if (!isParameterized && !this.type && !Object.values(fakeTypeAttributes).includes(a)) {
        this.type = attrName;
        this.typeOffset = origSignatureOffset + signatureOffset + offsets[index];
      } else if (!Object.values(fakeTypeAttributes).includes(a) && !this.languageServerMode) {
        error(a);
      }
    });

    this.isSample = attributes.some(a => a === fakeTypeAttributes.sample);
    this.isDefault = attributes.some(a => a === fakeTypeAttributes.default);

    if (this.isDefault && this.isSample) {
      this.warnings.push('Cannot use "default" and "sample" together.');
      this.isSample = false;
    }

    if (!this.languageServerMode) {
      compareSizeAttributes(this.typeAttributes, signature);
    }

    return [signature.slice(attributeString.length), origSignatureOffset + signatureOffset + attributeString.length];
  }

  extractDescription(origSignature, offset) {
    let signature = origSignature.trim();

    if (signature[0] === DESCRIPTION_DELIMITER) {
      signature = signature.substr(1).trim();
    }

    this.description = signature;
    this.descriptionOffset = offset + origSignature.indexOf(signature);
  }

  hasTypeAttribute(attrName) {
    return !!this.typeAttributes.find(a => (Array.isArray(a) ? a[0] === attrName : a === attrName));
  }
}

function splitAttributes(signature, languageServerMode) {
  const SUBTYPE_START_DELIMITER = '[';
  const SUBTYPE_END_DELIMITER = ']';

  let attributeValueContext = false;
  let subTypeContext = false;

  const attributes = [];
  const offsets = [];

  let lastSlicePos = 1;

  let attributesEndDelimiterFound = false;

  let slashesNumber = 0;

  for (let i = 1; i < signature.length; i++) {
    const char = signature[i];

    if (char === '"' && slashesNumber % 2 === 0) {
      attributeValueContext = !attributeValueContext;
    }

    if (char === '\\') {
      slashesNumber++;
    } else {
      slashesNumber = 0;
    }

    if (char === SUBTYPE_START_DELIMITER || char === SUBTYPE_END_DELIMITER) {
      subTypeContext = char === SUBTYPE_START_DELIMITER;
    }

    if (!attributeValueContext && !subTypeContext) {
      if (char === ATTRIBUTES_COMMA_DELIMITER || char === ATTRIBUTES_END_DELIMITER) {
        const rawAttr = signature.slice(lastSlicePos, i);
        const attr = rawAttr.trim();
        offsets.push(lastSlicePos + rawAttr.indexOf(attr));
        lastSlicePos = i + 1;

        attributes.push(attr);
      }

      if (char === ATTRIBUTES_END_DELIMITER) {
        attributesEndDelimiterFound = true;
        break;
      }
    }
  }

  if (!attributesEndDelimiterFound) {
    if (languageServerMode) {
      lastSlicePos = signature.length;
    } else {
      error(signature);
    }
  }

  return {
    attributes,
    offsets,
    attributeString: signature.slice(0, lastSlicePos),
  };
}

function splitValues(values) {
  const splitter = /,?\s?(`.+?`)|,(?=[^`]+?)/;
  const a = values.split(splitter);
  const splitted = a
    .filter(val => !!val)
    .map(val => stripBackticks(val.trim()));

  return splitted;
}

function stripBackticks(str) {
  while (str[0] === '`' && str[str.length - 1] === '`') {
    str = str.substr(1, str.length - 2);
  }

  return str.trim();
}

function compareSizeAttributes(attributes, signature) {
  let minLength;
  let maxLength;

  attributes.forEach(attribute => {
    if (!Array.isArray(attribute)) return;
    if (attribute[0] === 'minLength') {
      minLength = attribute[1];
    } else if (attribute[0] === 'maxLength') {
      maxLength = attribute[1];
    }
  });

  if (!minLength || !maxLength) return;

  if (maxLength < minLength || minLength < 0 || maxLength < 0) {
    error(signature);
  }
}

function convertValue(value, dataType) {
  let converted = value;
  if (!dataType) return value;

  if (dataType === 'number') {
    converted = Number(value);
    if (Number.isNaN(converted)) {
      error(undefined, `Invalid signature: ${value} is not a number`);
    }
  }
  return converted;
}

function error(sig, errorMsg) {
  throw new utils.SignatureError(errorMsg || `Invalid signature: ${sig}`);
}

module.exports = {
  parser: SignatureParser,
  traits: parserTraits,
  splitValues,
};
