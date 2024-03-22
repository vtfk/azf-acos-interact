const { logger } = require('@vtfk/logger')
const { callArchive } = require('../call-archive')

module.exports = async (jobDef, flowStatus) => {
  let orgData
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['syncEnterprise', 'Mapper is defined in options. Will use it.'])
    orgData = mapper(flowStatus)
  } else {
    logger('error', ['syncEnterprise', 'No mapper or default mapper is defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper in flow definition')
  }
  logger('info', ['syncEnterprise', 'Synching enterprise'])
  const { orgnr } = orgData
  if (!orgnr) {
    throw new Error('Missing required parameters in returned object from mapper. Must have orgnr')
  }
  const payload = {
    orgnr
  }
  const data = await callArchive('SyncEnterprise', payload)
  logger('info', ['syncEnterprise', 'Successfully synched enterprise', 'Recno', data.enterprise.recno])
  return data
}
