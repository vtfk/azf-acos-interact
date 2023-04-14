const axios = require('axios').default
const { archive } = require('../../config')
const { logger } = require('@vtfk/logger')

module.exports = async (flowStatus) => {
  logger('info', ['closeCase', 'Closing case'])

  const caseNumber = flowStatus.handleCase?.result?.CaseNumber
  if (!caseNumber) throw new Error('Could not find flowStatus.handleCase.result.CaseNumber. Did you remember to enable the handleCase job for the flow?')

  const payload = {
    system: 'archive',
    template: 'close-case',
    parameter: {
      caseNumber
    }
  }

  const headers = {
    'Ocp-Apim-Subscription-Key': archive.subscriptionKey
  }
  const { data } = await axios.post(`${archive.url}/archive`, payload, { headers })
  logger('info', ['closeCase', 'Case closed', data.CaseNumber])
  return data
}
