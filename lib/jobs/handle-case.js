const axios = require('axios').default
const { archive } = require('../../config')
const { logger } = require('@vtfk/logger')

module.exports = async (jobDef, flowStatus) => {
  logger('info', ['handleCase', 'starting job'])
  const headers = {
    'Ocp-Apim-Subscription-Key': archive.subscriptionKey
  }
  const getCaseParameter = jobDef.options?.getCaseParameter
  if (getCaseParameter) {
    logger('info', ['handleCase', 'getCaseParameter is defined in options. Will use it.'])
    const parameter = getCaseParameter(flowStatus)
    /* For azf-archive-v2
    const getCasePayload = {
      system: 'acos',
      template: 'get-case',
      parameter
    }
    */
    // for azt-archive-v1:
    const getCasePayload = {
      service: 'CaseService',
      method: 'GetCases',
      parameter,
      options: {
        onlyOpenCases: true
      }
    }
    const { data } = await axios.post(`${archive.url}/archive`, getCasePayload, { headers })
    if (data.length >= 1) {
      if (data.length > 1) logger('warn', ['handleCase', 'Found more than one case with getCase parameter', 'using first in the list'])
      logger('info', ['handleCase', 'Found case with getCase parameter', 'caseNumber', data[0].CaseNumber])

      return {
        CaseNumber: data[0].CaseNumber,
        Recno: data[0].Recno
      }
    }
    // we did not find a case. Let's create one!
  }
  let parameter
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['handleCase', 'Mapper is defined in options. Will use it.'])
    parameter = mapper(flowStatus)
  } else {
    logger('info', ['handleCase', 'No mapper defined in options', 'using default'])
    throw new Error('No default mapper is set up for handleCase. Please provide a custom mapper in flow definition')
  }
  /* For azf-archive-v2
  const payload = {
    system: 'acos',
    template: 'create-case',
    parameter
  }
  */
  // for azt-archive-v1:
  const payload = {
    service: 'CaseService',
    method: 'CreateCase',
    parameter
  }

  const { data } = await axios.post(`${archive.url}/archive`, payload, { headers })
  logger('info', ['handleCase', 'Successfully handled case', data.CaseNumber])
  return data
}
