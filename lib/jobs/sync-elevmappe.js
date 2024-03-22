const { logger } = require('@vtfk/logger')
const { callArchive } = require('../call-archive')

module.exports = async (jobDef, flowStatus) => {
  let personData
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['syncElevmappe', 'Mapper is defined in options. Will use it.'])
    personData = mapper(flowStatus)
  } else if (jobDef.options?.useDefaultStudentMapper) {
    logger('info', ['syncElevmappe', 'useDefaultStudentMapper is true in options', 'using defaultStudentMapper'])
    throw new Error("Don't use useDefaultStudentMapper. We are not comfortable with this feature now. Please provide a custom mapper in flow definition")
    /*
    const defaultData = flowStatus.parseXml?.result?.ArchiveData?.Fnr
    if (!defaultData) throw new Error('No value found in defaultData: ArchiveData.Fnr, Are you using the correct avleveringsfil from Acos?')
    personData = {
      ssn: defaultData
    }
    */
  } else {
    logger('info', ['syncElevmappe', 'No mapper or default mapper is defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper or default mapper in flow definition')
  }

  let payload
  if (personData.fakeSsn) {
    logger('info', ['syncElevmappe', 'Synching elevmappe with fake SSN'])
    const { fakeSsn, firstName, lastName, streetAddress, zipCode, zipPlace, birthdate, gender, forceUpdate } = personData
    if (!(fakeSsn && firstName && lastName && streetAddress && zipCode && zipPlace && birthdate && gender)) {
      throw new Error('missing required parameters. Must be fakeSsn, firstName, lastName, streetAddress, zipCode, zipPlace, birthdate and gender')
    }
    payload = {
      fakeSsn,
      birthdate,
      gender,
      firstName,
      lastName,
      streetAddress,
      zipCode,
      zipPlace,
      forceUpdate
    }
  }

  if (personData.manualData && !personData.fakeSsn) {
    logger('info', ['syncElevmappe', 'Synching elevmappe with skipDSF'])
    const { manualData, ssn, firstName, lastName, streetAddress, zipCode, zipPlace, forceUpdate } = personData
    if (!(manualData && ssn && firstName && lastName && streetAddress && zipCode && zipPlace)) {
      throw new Error('missing required parameters. Must be manualData, ssn, firstName, lastName, streetAddress, zipCode, zipPlace')
    }
    payload = {
      ssn,
      firstName,
      lastName,
      streetAddress,
      zipCode,
      zipPlace,
      manualData,
      forceUpdate
    }
  }

  if (!personData.manualData && !personData.fakeSsn) {
    logger('info', ['syncElevmappe', 'Synching elevmappe'])
    const { ssn, forceUpdate } = personData
    if (!ssn) {
      throw new Error('missing required parameters. Must have ssn')
    }
    payload = {
      ssn,
      forceUpdate
    }
  }
  const data = await callArchive('SyncElevmappe', payload)
  logger('info', ['syncElevmappe', 'Successfully synched elevmappe', 'privatePerson recNo', data.privatePerson.recno, 'elevmappe saksnummer', data.elevmappe.CaseNumber])
  return data
}
