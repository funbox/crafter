const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const SignatureParser = require('./SignatureParser');
const ParameterDefaultValueParser = require('./ParameterDefaultValueParser');
const ParameterMembersParser = require('./ParameterMembersParser');

const parameterIdentifierRegex = /^`?(([\w.-])*|(%[A-Fa-f0-9]{2})*)+`?/;
const parameterExampleRegex = /^`?[^`]+`?/;

module.exports = Object.assign(Object.create(require('./AbstractParser')), {
  processSignature(node, context, result) {
    result.element = Refract.elements.member;

    const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
    const signature = new SignatureParser(text);

    result.content = {
      key: {
        element: Refract.elements.string,
        content: signature.name,
      },
    };

    if (signature.example) {
      result.content.value = {
        element: Refract.elements.string,
        content: signature.example,
      };
    }

    let index;

    if ((index = signature.attributes.indexOf('optional')) !== -1) {
      result.attributes = {
        typeAttributes: ['optional'],
      };

      signature.attributes.splice(index, 1);
    }

    if ((index = signature.attributes.indexOf('required')) !== -1) {
      result.attributes = {
        typeAttributes: ['required'],
      };

      signature.attributes.splice(index, 1);
    }

    const description = signature.description;
    const type = signature.attributes.length > 0 ? signature.attributes[0] : null;

    if (description || type) {
      result.meta = {};
    }

    if (description) {
      result.meta.description = description;
    }

    if (type) {
      result.meta.title = type;
    }

    return node.firstChild.next && node.firstChild.next.firstChild || utils.nextNode(node);
  },

  sectionType(node, context) {
    if (node.type === 'item') { // TODO: вынести проверку node.type в AbstractParser
      const text = utils.nodeText(node.firstChild, context.sourceLines).trim();

      try {
        const signature = new SignatureParser(text);
        if (signature.attributes.length <= 2) {
          return SectionTypes.parameter;
        }
      } catch (e) {
      }
    }

    return SectionTypes.undefined;
  },

  nestedSectionType(node, context) {
    return SectionTypes.calculateSectionType(node, context, [
      ParameterDefaultValueParser,
      ParameterMembersParser
    ]);
  },

  processNestedSection(node, context, result) {
    let nextNode, childRes;

    if (!result.content.value) {
      result.content.value = {};
    }

    if (!result.content.value.attributes) {
      result.content.value.attributes = {};
    }


    if (ParameterDefaultValueParser.sectionType(node, context) !== SectionTypes.undefined) {
      [nextNode, childRes] = ParameterDefaultValueParser.parse(node, context);
      result.content.value.attributes.default = childRes;
    } else {
      [nextNode, childRes] = ParameterMembersParser.parse(node, context);
      result.content.value.attributes.enumerations = childRes;
    }

    return nextNode;
  },

  processDescription(node) {
    return node;
  }
});