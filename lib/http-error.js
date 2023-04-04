/**
 *
 * @param {string} message  - a summary of the error
 * @param {*} [error=null] - error data if applicable
 * @returns {Object}
 */
module.exports = (message, error = null) => {
  return { message, error }
}
