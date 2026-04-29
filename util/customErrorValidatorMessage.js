/**
 * min items
 * @param {*} field field name
 * @param {*} min no. of items
 * @returns message
 */
const minItemsMessage = (field, items) => `${field} must have atleast ${items} item.`

// enum message
const enumMessage = (field) => `${field} must be equal to selected enums.`

// invalidd type mismatch message
const typeMisMatchMessage = (field) => `Invalid ${field} format.`

module.exports = {
    minItemsMessage,
    enumMessage,
    typeMisMatchMessage
};