const axios = require('axios').default
const { archive } = require('../../config')
const { logger } = require('@vtfk/logger')

module.exports = async (jobDef, flowStatus) => {
  let personData
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['syncEmployee', 'Mapper is defined in options. Will use it.'])
    personData = mapper(flowStatus)
  } else {
    logger('info', ['syncEmployee', 'No mapper defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper or default mapper in flow definition')
  }
  const headers = {
    'Ocp-Apim-Subscription-Key': archive.subscriptionKey
  }

  let payload
  const foolStandard = true
  if (foolStandard) { // in case we need more cases here. For example the need for  fake ssn or skip Freg.
    logger('info', ['syncEmployee', 'Synching employee'])
    const { ssn, upn, allowNullValues } = personData
    if (!ssn) {
      throw new Error('Missing required parameter "ssn". Mapper is probably set up wrong.')
    }
    if (!upn) {
      throw new Error('Missing required parameter "upn". Mapper is probably set up wrong.')
    }
    payload = {
      ssn,
      upn,
      allowNullValues
    }
  }
  const { data } = await axios.post(`${archive.url}/SyncEmployee`, payload, { headers })
  logger('info', ['syncEmployee', 'Successfully synched employee', 'privatePerson recno', data.privatePerson.recno, 'employee project number', data.employee.projectNumber])
  return data
}
