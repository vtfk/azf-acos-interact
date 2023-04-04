
const axios = require('axios').default
const { archive } = require('../../config')
const { logger } = require('@vtfk/logger')

module.exports = async (jobDef, flowStatus) => {
  let personData
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['syncElevmappe', 'Mapper is defined in options. Will use it.'])
    personData = mapper(flowStatus)
  } else {
    logger('info', ['syncElevmappe', 'No mapper defined in options', 'using default'])
    const defaultData = flowStatus.parseXml?.result?.ArchiveData?.Fnr
    if (!defaultData) throw new Error('No value found in defaultData: ArchiveData.Fnr, Are you using the correct avleveringsfil from Acos?')
    personData = {
      ssn: defaultData
    }
  }
  const headers = {
    'Ocp-Apim-Subscription-Key': archive.subscriptionKey
  }

  let payload
  if (personData.generateFakeSsn) {
    logger('info', ['syncElevmappe', 'Synching elevmappe with fake SSN'])
    const { generateFakeSsn, firstName, lastName, streetAddress, zipCode, zipPlace, birthdate, gender } = personData
    if (!(generateFakeSsn && firstName && lastName && streetAddress && zipCode && zipPlace && birthdate && gender)) {
      throw new Error('missing required parameters. Must be generateFakeSsn, firstName, lastName, streetAddress, zipCode, zipPlace, birthdate and gender')
    }
    payload = {
      generateFakeSsn,
      birthdate,
      gender,
      firstName,
      lastName,
      streetAddress,
      zipCode,
      zipPlace,
      addressCode: 0,
      skipDSF: true
    }
  }

  if (personData.skipDSF && !personData.generateFakeSsn) {
    logger('info', ['syncElevmappe', 'Synching elevmappe with skipDSF'])
    const { skipDSF, ssn, firstName, lastName, streetAddress, zipCode, zipPlace } = personData
    if (!(skipDSF && ssn && firstName && lastName && streetAddress && zipCode && zipPlace)) {
      throw new Error('missing required parameters. Must be skipDSF, ssn, firstName, lastName, streetAddress, zipCode, zipPlace')
    }
    payload = {
      ssn,
      firstName,
      lastName,
      streetAddress,
      zipCode,
      zipPlace,
      addressCode: 0,
      skipDSF
    }
  }

  if (!personData.skipDSF && !personData.generateFakeSsn) {
    logger('info', ['syncElevmappe', 'Synching elevmappe'])
    const { ssn } = personData
    if (!ssn) {
      throw new Error('missing required parameters. Must have ssn')
    }
    payload = {
      ssn
    }
  }
  console.log(payload)
  const { data } = await axios.post(`${archive.url}/SyncElevmappe`, payload, { headers })
  logger('info', ['syncElevmappe', 'Successfully synched elevmappe'])
  return data
}
