const identifierRegex = /^`?(([\w.-]|%[a-fA-F0-9]{2})+)`?/

class SignatureParser {
  constructor(signature) {
    let matchData;

    matchData = identifierRegex.exec(signature);

    if (!matchData) error(signature);

    this.name = matchData[1];

    signature = signature.slice(matchData[0].length).trim();

    if (signature[0] === ':') {
      signature = this.extractExample(signature);
    }

    if (!signature) return;

    if (signature[0] === '(') {
      signature = this.extractAttributes(signature);
    }

    if (!signature) return;

    if (signature[0] === '-') {
      this.description = signature.slice(1).trim();
    } else {
      error(signature);
    }
  }

  extractExample(signature) {
    signature = signature.slice(1).trim();
    let searchSymbol = '(';
    let pos = 0;
    this.example = '';

    if (signature[0] === '`') {
      pos = 1;
      searchSymbol = '`';
    }

    while (pos < signature.length && signature[pos] !== searchSymbol) {
      this.example = `${this.example}${signature[pos]}`;
      pos++;
    }

    if (pos >= signature.length && searchSymbol === '`') error(signature);

    if (pos < signature.length && searchSymbol === '(') {
      this.example = this.example.trim();
      pos--;
    }

    return signature.slice(pos + 1).trim();
  }

  extractAttributes(signature) {
    const matchData = /^\(([^)]+)\)/.exec(signature);

    if (!matchData) error(signature);

    this.attributes = matchData[1].split(',').map(a => a.trim());

    return signature.slice(matchData[0].length).trim();
  }
}

function error(sig) {
  throw new Error(`Invalid signature: ${sig}`);
}

module.exports = SignatureParser;