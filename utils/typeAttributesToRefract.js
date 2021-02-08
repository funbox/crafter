const Refract = require('../Refract');

module.exports = function typeAttributesToRefract(attributes) {
  return {
    typeAttributes: {
      element: Refract.elements.array,
      content: attributes.map(a => {
        if (Array.isArray(a)) {
          return {
            element: Refract.elements.member,
            content: {
              key: {
                element: Refract.elements.string,
                content: a[0],
              },
              value: {
                element: Refract.elements.string,
                content: a[1],
              },
            },
          };
        }
        return {
          element: Refract.elements.string,
          content: a,
        };
      }),
    },
  };
};
