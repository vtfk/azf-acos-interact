const axios = require('axios').default
const { archive } = require('../../config')
const { logger } = require('@vtfk/logger')

module.exports = async (jobDef, flowStatus) => {
  let personData
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['syncPrivatePerson', 'Mapper is defined in options. Will use it.'])
    personData = mapper(flowStatus)
  } else if (jobDef.options?.useDefaultStudentMapper) {
    logger('info', ['syncPrivatePerson', 'useDefaultStudentMapper is true in options', 'using defaultStudentMapper'])
    throw new Error("Don't use useDefaultStudentMapper. We are not comfortable with this feature now. Please provide a custom mapper in flow definition")
    /*
    const defaultData = flowStatus.parseXml?.result?.ArchiveData?.Fnr
    if (!defaultData) throw new Error('No value found in defaultData: ArchiveData.Fnr, Are you using the correct avleveringsfil from Acos?')
    personData = {
      ssn: defaultData
    }
    */
  } else {
    logger('info', ['syncPrivatePerson', 'No mapper or default mapper is defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper or default mapper in flow definition')
  }
  const headers = {
    // Til fremtiden: lag en funksjon som henter AzureAD token og legger i header
    'Ocp-Apim-Subscription-Key': archive.subscriptionKey
  }

  let payload
  if (personData.generateFakeSsn) {
    logger('info', ['syncPrivatePerson', 'Synching private person with fake SSN'])
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
    logger('info', ['syncPrivatePerson', 'Synching private person with skipDSF'])
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
    logger('info', ['syncPrivatePerson', 'Synching private person'])
    const { ssn } = personData
    if (!ssn) {
      throw new Error('missing required parameters. Must have ssn')
    }
    payload = {
      ssn
    }
  }
  const { data } = await axios.post(`${archive.url}/SyncPrivatePerson`, payload, { headers })
  logger('info', ['syncPrivatePerson', 'Successfully synched private person', 'RecNo', data.privatePerson.recno])
  return data
}
