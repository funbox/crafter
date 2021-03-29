module.exports = function makeDefaultBodyFromTemplate(bodyTemplate) {
  if (Array.isArray(bodyTemplate)) {
    return bodyTemplate.map(x => makeDefaultBodyFromTemplate(x));
  }
  if (bodyTemplate !== null && typeof bodyTemplate === 'object') {
    let result = {};
    Object.keys(bodyTemplate).forEach(key => {
      if (/^__oneOf-\d+__$/.test(key)) {
        result = { ...result, ...makeDefaultBodyFromTemplate(bodyTemplate[key][0]) };
      } else {
        result[key] = makeDefaultBodyFromTemplate(bodyTemplate[key]);
      }
    });
    return result;
  }
  return bodyTemplate;
};
