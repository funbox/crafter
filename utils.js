class CrafterError extends Error {
  constructor() {
    super(...arguments);
  }
}

module.exports = {
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
      curNode = curNode.next;
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

      for (let i = startline + 1; i < endline; i++) {
        result.push(sourceLines[i - 1]);
      }

      result.push(sourceLines[endline].slice(0, endcolumn));
    }

    return result.join('\n').trim();
  },

  nextNode(node) {
    if (node.next) {
      const result = node.next;

      if (result) {
        if (result.type === 'list') {
          return result.firstChild || this.nextNode(result);
        } else {
          return result;
        }
      }
    }

    if (!node.parent) {
      return null;
    }

    return this.nextNode(node.parent);
  },

  CrafterError,
};