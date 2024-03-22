const { logger } = require('@vtfk/logger')
const { callArchive } = require('../call-archive')

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

  let payload
  const foolStandard = true
  if (foolStandard) { // in case we need more cases here. For example the need for  fake ssn or skip Freg. Haha, fool standard :D
    logger('info', ['syncEmployee', 'Synching employee'])
    const { ssn, forceUpdate } = personData
    if (!ssn) {
      throw new Error('Missing required parameter "ssn". Mapper is probably set up wrong.')
    }
    payload = {
      ssn,
      forceUpdate
    }
  }
  const data = await callArchive('SyncEmployee', payload) // NOTE - this is not implemented in new archive yet, contact the bearded idiot when you need it! Bearded idiot is contacted - this should be up and runnning! 🧔‍♂️
  logger('info', ['syncEmployee', 'Successfully synched employee', 'privatePerson recno', data.privatePerson.recno, 'enterprise recno', data.responsibleEnterprise.recno, 'manager recno', data.archiveManager.recno])
  return data
}
