const { storageAccount } = require('../../config')
const { logger } = require('@vtfk/logger')
const { get } = require('@vtfk/azure-blob-client')
const { callArchive } = require('../call-archive')

const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

module.exports = async (jobDef, flowStatus) => {
  let payload
  const mainDocument = flowStatus.parseXml.result.files.find(file => file.type === 'H')
  if (!mainDocument) throw new Error('No file with type "H" found in flowStatus.parseXml.result.files. Something is probably wrong with avlevering from Acos')
  const blobContent = await get(mainDocument.path, { ...blobOptions, encoding: 'base64' })
  const base64 = blobContent.data
  const attachmentList = flowStatus.parseXml.result.files.filter(file => file.type === 'V')
  const attachments = []
  for (const attachment of attachmentList) {
    const attachmentContent = await get(attachment.path, { ...blobOptions, encoding: 'base64' })
    if (Array.isArray(attachmentContent)) throw new Error(`Found more than one blob on path ${attachment.path}, please check blob and parseXml.result.files (sannsynligvis noe rart med et av filnavnene)!!`) // Da har blob client returnert flere en en blob!!
    const archiveAttachment = {
      title: attachment.desc,
      format: attachmentContent.extension,
      base64: attachmentContent.data,
      versionFormat: (attachmentContent.extension.toLowerCase() === 'pdf') ? 'P' : null // Dersom vedlegget er produksjonsformat fordi vi ikke vet om det er i PDF/A format. Hvis ikke, lar vi fileformat kodetabellen i 360 ordne dette for oss, ved å sende inn null
    }
    attachments.push(archiveAttachment)
  }
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['archive', 'Mapper is defined in options. Will use it.'])
    payload = mapper(flowStatus, base64, attachments)
  } else {
    logger('info', ['archive', 'No mapper or default mapper is defined in options'])
    throw new Error('No mapper or default mapper is defined in options. Please provide a custom mapper or default mapper in flow definition')
  }
  if (payload.service !== 'DocumentService' || payload.method !== 'CreateDocument') throw new Error('Du må jo bruke CreateDocument og DocumentService når du skal opprette et dokument! Dummen!')
  payload.parameter.SendersReference = flowStatus.refId
  const data = await callArchive('archive', payload)
  logger('info', ['archive', 'Successfully archived document', data.DocumentNumber])
  return data
}
