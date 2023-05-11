const roomService = require('../lib/room-service/room-service')
const { logConfig, logger } = require('@vtfk/logger')

module.exports = async function (context, myTimer) {
  logConfig({
    prefix: 'azf-acos-interact - RoomService',
    azure: {
      context,
      excludeInvocationId: true
    }
  })
  try {
    await roomService()
  } catch (error) {
    logger('error', ['Statusrapportering feilet', error.response?.data || error.stack || error.toString()])
  }
}
