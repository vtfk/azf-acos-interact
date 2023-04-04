const axios = require('axios').default
const { archive } = require('../../config')
const { logger } = require('@vtfk/logger')

module.exports = async (flowStatus) => {
  logger('info', ['signOff', 'Signing off document'])

  const documentNumber = flowStatus.archive?.result?.DocumentNumber
  if (!documentNumber) throw new Error('Could not find flowStatus.archive.result.DocumentNumber. Did you remember to enable the archive job for the flow?')

  const payload = {
    system: 'archive',
    template: 'signoff-TO',
    parameter: {
      documentNumber
    }
  }

  const headers = {
    'Ocp-Apim-Subscription-Key': archive.subscriptionKey
  }
  const { data } = await axios.post(`${archive.url}/archive`, payload, { headers })
  logger('info', ['signOff', 'Successfully signed off document', data.DocumentNumber])
  return data
}
