const dispatcher = require('../lib/dispatcher')
module.exports = async function (context, req) {
  try {
    const result = await dispatcher()
    return { status: 200, body: result }
  } catch (error) {
    console.log(error)
    return { status: 500, body: error }
  }
}
