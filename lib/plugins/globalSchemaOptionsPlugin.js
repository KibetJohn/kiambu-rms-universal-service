const _ = require("lodash");
/**
 *  modified global schema settings.
 *  1). modifying toJSON method settings
 */
module.exports = function globalSchemaOptionsPlugin(schema) {
  schema.set("toJSON", {
    transform: (doc, obj) => {
      delete obj.__v;
      delete obj.id;
      delete obj.password;
      return obj;
    },
    virtuals: true
  });

  const options = schema.options;

  if (!_.has(options, "timestamps")) {
    // set timestamps
    schema.set("timestamps", true);
  }
};
