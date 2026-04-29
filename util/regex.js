module.exports = {
  UUID_PATTERN:
    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
  INTEGER_PATTERN: "^[0-9]+$",
  VEHICLE_PATTERN_NEW: "^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{5,}$",
  EMAIL: "^\\S+@\\S+\\.\\S+$",
  POSITIVE_NUMBER_PATTERN: "^[1-9][0-9]*$",
  REFERENCE_NUMBER_PATTERN: "^[0-9]{14}$",
  DECIMAL_PATTERN: "^[0-9]+(\\.[0-9]+)?$",
  YEAR_PATTERN: "^[0-9]{4}$",
};
