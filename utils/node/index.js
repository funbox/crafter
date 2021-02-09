module.exports = {
  headerText(node, sourceLines) {
    return this.nodeText(node, sourceLines).slice(node.level).trim();
  },

  headerTextWithOffset(node, sourceLines) {
    const text = this.nodeText(node, sourceLines).slice(node.level);
    const trimmedText = text.trim();
    return [trimmedText, text ? node.level + text.indexOf(trimmedText) : undefined];
  },

  isCurrentNodeOrChild(node, rootNode) {
    while (node) {
      if (node === rootNode) {
        return true;
      }

      node = node.parent;
    }

    return false;
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

  nextNodeOfType(node, type) {
    const result = this.nextNode(node);
    if (!result) return result;
    if (result.type === type) {
      return result;
    }
    return this.nextNodeOfType(result, type);
  },

  nodeText(node, sourceLines) {
    if (!node) {
      return '';
    }

    const localSourceLines = node.sourceLines || sourceLines;
    const [startline, startcolumn] = node.sourcepos[0];
    const [endline, endcolumn] = node.sourcepos[1];
    const keepWhitespaces = node.type === 'code_block' || node.type === 'item';

    const result = [];

    if (startline === endline) {
      result.push(localSourceLines[startline - 1].slice(startcolumn - 1, endcolumn));
    } else {
      result.push(localSourceLines[startline - 1].slice(startcolumn - 1));

      for (let i = startline + 1; i < endline; i += 1) {
        result.push(localSourceLines[i - 1]);
      }

      result.push(localSourceLines[endline - 1].slice(0, endcolumn));
    }

    return result.map(line => (keepWhitespaces ? line : line.trim())).join('\n').trim();
  },
};
