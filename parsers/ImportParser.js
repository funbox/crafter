const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

const ImportRegex = /^[Ii]mport\s+(.+)$/;
const CrafterError = utils.CrafterError;
const ImportElement = utils.ImportElement;

module.exports = (Parsers) => {
  Parsers.ImportParser = {
    async parse(node, context) {
      const oldRootNode = context.rootNode;
      context.rootNode = node;
      let curNode = node;
      let result;

      [curNode, result] = await this.processSignature(curNode, context);

      result = this.finalize(context, result);

      context.rootNode = oldRootNode;
      return [curNode, result];
    },

    async processSignature(node, context) {
      const nextNode = utils.nextNode(node);
      const cachedElement = this.resolveFromCache(node, context);
      const importElement = cachedElement || (await this.resolveImport(node, context));
      context.importsSourceMaps.push(importElement.sourceMap);
      return [nextNode, importElement];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (ImportRegex.test(subject)) {
          return SectionTypes.import;
        }
      }

      return SectionTypes.undefined;
    },

    /**
     * @param curNode
     * @param {Context} context
     * @return {null|ImportElement}
     */
    resolveFromCache(curNode, context) {
      if (curNode.importId && context.importCache.has(curNode.importId)) {
        return context.importCache.get(curNode.importId);
      }

      return null;
    },

    /**
     * @param curNode
     * @param {Context} context
     * @return {Promise<ImportElement>}
     */
    async resolveImport(curNode, context) {
      const { usedFiles } = context;

      const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);

      if (!context.entryDir) {
        throw new CrafterError('Import error. Entry directory should be defined.', sourceMap);
      }

      try {
        const filename = this.getFilename(curNode, context);

        if (!/\.apib$/.test(filename)) {
          throw new CrafterError(`File import error. File "${filename}" must have extension type ".apib".`, sourceMap);
        }

        if (usedFiles.includes(filename)) {
          throw new CrafterError(`Recursive import: ${usedFiles.join(' → ')} → ${filename}`, sourceMap);
        }

        const { ast: childAst, context: childContext } = await context.getApibAST(filename, sourceMap);
        const importId = childContext.currentFile;

        let childNodeToCheck = childAst.firstChild;

        if (!childNodeToCheck) {
          throw new CrafterError(`File import error. File "${filename}" is empty.`, sourceMap);
        }

        while (childNodeToCheck && Parsers.ImportParser.sectionType(childNodeToCheck, childContext) === SectionTypes.import) {
          // файл может начинаться с импорта, в таком случае, его нужно пропустить
          childNodeToCheck = childNodeToCheck.next;
        }
        if (childNodeToCheck && Parsers.BlueprintParser.nestedSectionType(childNodeToCheck, childContext) === SectionTypes.undefined) {
          throw new CrafterError(`Invalid content of "${filename}". Can't recognize "${utils.nodeText(childNodeToCheck, childContext.sourceLines)}" as API Blueprint section.`, sourceMap);
        }

        context.filePaths.push(`${context.resolvePathRelativeToEntryDir(filename)}`);

        context.importsSourceMaps.push(...childContext.importsSourceMaps);
        childContext.usedFiles.unshift(...context.usedFiles);

        const [, importedBlueprint] = await Parsers.BlueprintParser.parse(childAst.firstChild, childContext);
        const importedBlueprintError = findError(importedBlueprint);

        context.filePaths = [...new Set(context.filePaths.concat(childContext.filePaths))];

        if (importedBlueprintError) {
          const importError = new Error(importedBlueprintError.text);
          importError.sourceMap = importedBlueprintError.sourceMap;
          throw importError;
        }

        const importElement = new ImportElement(importId, importedBlueprint, childContext, sourceMap);

        curNode.importId = importId;
        context.importCache.set(importId, importElement);

        // Если в Language Server Mode случится ошибка и до этой инструкции выполнение не дойдет,
        // то при повторной попытке импорта данного файла случится Recursive import.
        // На практике ничего страшного не произойдет, т.к. ошибка случится только в случае,
        // если файл некорректный, поэтому в любом случае при попытке повторного импорта произошла бы
        // ошибка, а для данного режима не важно какая именно ошибка произойдет.
        usedFiles.pop();

        return importElement;
      } catch (e) {
        curNode.unlink();
        if (!context.languageServerMode) {
          throw e;
        }
        const emptyElement = new ImportElement();
        emptyElement.sourceMap = sourceMap;
        return emptyElement;
      }
    },

    getFilename(node, context) {
      return ImportRegex.exec(utils.headerText(node, context.sourceLines))[1].trim();
    },

    /**
     * @param {Context} context
     * @param {ImportElement} result
     * @return {ImportElement}
     */
    finalize(context, result) {
      if (context.typeExtractingInProgress) {
        return result;
      }

      const localImportHistory = new Set();

      const importHistoryFilterFn = (element) => {
        if (!context.importHistory.has(element.importedFrom)) {
          localImportHistory.add(element.importedFrom);
          return true;
        }
        return false;
      };

      result.refractElements = result.refractElements.filter(importHistoryFilterFn);
      result.refractAnnotations = result.refractAnnotations.filter(importHistoryFilterFn);
      context.importHistory = new Set([...context.importHistory, ...localImportHistory]);
      return result;
    },
  };
  return true;
};

function findError(blueprintElement) {
  return blueprintElement.annotations.find(anno => anno.type === 'error');
}
