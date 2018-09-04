const Refract = require('./Refract');
const types = require('./types');

class CrafterError extends Error {
}

module.exports = {
  typeAttributesToRefract(typeAttributes) {
    return {
      typeAttributes: {
        element: Refract.elements.array,
        content: typeAttributes.map(a => ({
          element: Refract.elements.string,
          content: a,
        })),
      },
    };
  },

  headerText(node, sourceLines) {
    return this.nodeText(node, sourceLines).slice(node.level).trim();
  },

  extractDescription(curNode, sourceLines) {
    let description = '';

    while (curNode && curNode.type === 'paragraph') {
      if (description) {
        description += '\n\n';
      }
      description += this.nodeText(curNode, sourceLines);
      curNode = this.nextNode(curNode);
    }

    return [curNode, description];
  },

  nodeText(node, sourceLines) {
    const [startline, startcolumn] = node.sourcepos[0];
    const [endline, endcolumn] = node.sourcepos[1];

    const result = [];

    if (startline === endline) {
      result.push(sourceLines[startline - 1].slice(startcolumn - 1, endcolumn));
    } else {
      result.push(sourceLines[startline - 1].slice(startcolumn - 1));

      for (let i = startline + 1; i < endline; i += 1) {
        result.push(sourceLines[i - 1]);
      }

      result.push(sourceLines[endline - 1].slice(0, endcolumn));
    }

    return result.map(line => line.trim()).join('\n').trim();
  },

  nextNode(node) {
    if (node.next) {
      const result = node.next;

      if (result) {
        if (result.type === 'list') {
          return result.firstChild || this.nextNode(result);
        }
        return result;
      }
    }

    if (!node.parent) {
      return null;
    }

    return this.nextNode(node.parent);
  },

  resolveType(type) {
    const result = {};

    const matchData = /^(array|enum)\s*(\[(.*)])?$/.exec(type);

    if (matchData) {
      const resolvedType = matchData[1];
      result.type = types[resolvedType];
      if (matchData[3]) {
        result.nestedTypes = matchData[3].split(',').map(rawType => rawType.trim()).filter(t => !!t);
      } else {
        result.nestedTypes = [];
      }
    } else {
      result.type = type;
    }

    return result;
  },

  compareAttributeTypes(baseAttr, childAttr) {
    const baseType = baseAttr.type;

    switch (baseType) {
      case 'number':
        if (childAttr.type) return true; // если для enumMember задан свой тип, то всё ок
        if (isNaN(childAttr.name)) return false;
        break;
      default:
        return true;
    }

    return true;
  },

  showWarningMessage(text) {
    console.log('\x1b[33m%s\x1b[0m', text); // font yellow color
  },

  CrafterError,
};
