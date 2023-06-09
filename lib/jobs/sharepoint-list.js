/*
Må kjøre parseXml (da får vi metadata og filer)
Trenger data om sharePoint-lista (site, liste og kolonner)
Legge sharepoint url i env.

To typer:

1: Ett skjema = en ny rad i lista
2: Ett skjema = flere rader i lista (eks. en bruker melder seg på flere kurs (en rad pr kurs))

ta hensyn til vedlegg (som oftest ønskes også skjema-PDF som vedlegg)

Vi benytter batch-post til Graph API
Intern feilhåndtering i kallene. Denne gjør vi selvfølgelig så fancy som mulig.

Bør(!) kunne kjøre jobben flere ganger der destinasjonen er ulik (denne får vi komme tilbake til.....)

Mulig behov senere: oppdatering av liste (denne får vi komme tilbake til.....)

*/

const axios = require('axios').default
const { storageAccount, graphUrl, sharepointClient, nodeEnv } = require('../../config')
const { logger } = require('@vtfk/logger')
const { get } = require('@vtfk/azure-blob-client')
const graphToken = require('../get-graph-token')
const getSharepointToken = require('../get-sharepoint-token')

const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

const createBatchRequest = (listItems) => {
  if (listItems.length > 20) throw new Error("You can't add more than 20 items at once in sharepoint-list. Contact tech support")
  const requests = []
  for (const item of listItems) {
    if (!item.siteId) throw new Error('"siteId" is missing from sharePointList.options.mapper. Please update flow-file')
    if (!item.listId) throw new Error('"listId" is missing from sharePointList.options.mapper. Please update flow-file')
    if (!item.path) throw new Error('"path" is missing from sharePointList.options.mapper. Please update flow-file')
    const itemReq = {
      id: item.id,
      method: 'POST',
      path: item.path,
      url: `/sites/${item.siteId}/lists/${item.listId}/items`,
      body: {
        fields: item.fields
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }
    requests.push(itemReq)
  }
  return { requests }
}

const repackBatchRequests = (response, originalRequest, listItems, files) => {
  const failedRequests = response.responses.filter(res => res.status !== 201) // hent alle forespørslene vi sendte til Graph som ikke klarte å lage listeelementer
  const retryRequests = originalRequest.requests.filter(req => failedRequests.some(res => res.id === req.id)) // hent de forespørslene som feilet fra den opprinnelige batch-forespørselen mot Graph slik at vi slipper å opprette på nytt
  const retryPayload = { requests: retryRequests } // lag en ny batch-payload med kun de forespørslene som feilet slik at disse er klare til å kjøre på nytt ved neste kjøring
  const successRequests = response.responses.filter(res => res.status === 201) // hent alle forespørsler vi sendte til Graph som gikk bra (som klarte å lage listeelementer)
  const needsUploadFileItems = listItems.filter(item => (item.uploadFormAttachments || item.uploadFormPdf) && successRequests.some(req => req.id === item.id)) // finn alle listeelementer fra flowdef-fila (skjema) som har opplasting av fil / vedlegg = true og der det tilsvarende forepøslenen for dette elemenet har gått bra (listeelementet er opprettet)
  const uploadFileItemsWithId = needsUploadFileItems.map(item => { // utvid lista fra linja over til å også inneholde listeelementets interne SharePoint-id. Nå har vi en liste over de listeelementene som skal ha opplasting av fil / vedlegg og som har blitt opprettet i sp-lista
    const correspondingResponseItem = successRequests.find(req => req.id === item.id)
    return {
      ...item,
      spItemId: correspondingResponseItem.body.id
    }
  })
  const uploadFileItems = []
  // gå gjennom uploadFIleItemsWithId. FOr hvert element; skal vi sjekke om den skal ha fil? legg til et nytt element i uploadFIleItems med itemet pluss data til fila. Skal den ha vedlegg? gjør det samme PR. vedlegg
  const mainDocument = files.find(file => file.type === 'H')
  if (!mainDocument) throw new Error('No file with type "H" found in flowStatus.parseXml.result.files. Something is probably wrong with avlevering from Acos')
  const attachmentList = files.filter(file => file.type === 'V')

  for (const fileItem of uploadFileItemsWithId) {
    if (fileItem.uploadFormPdf) {
      uploadFileItems.push({ ...fileItem, file: mainDocument })
    }
    if (fileItem.uploadFormAttachments) {
      for (const attachment of attachmentList) {
        uploadFileItems.push({ ...fileItem, file: attachment })
      }
    }
  }
  return {
    retryPayload,
    uploadFileItems
  }
}

module.exports = async (jobDef, flowStatus) => {
  let listItems
  const mapper = jobDef.options?.mapper
  if (mapper) {
    logger('info', ['sharePointList', 'Mapper is defined in options. Will use it.'])
    listItems = mapper(flowStatus).map((item, i) => { return { ...item, id: (i + 1).toString() } })
    listItems = listItems.map(item => {
      if (nodeEnv === 'production') {
        item.siteId = item.prodSiteId
        item.siteName = item.prodPath.split('/')[1]
        item.path = item.prodPath
        item.listId = item.prodListId
      } else {
        item.siteId = item.testSiteId
        item.siteName = item.testPath.split('/')[1]
        item.path = item.testPath
        item.listId = item.testListId
      }
      return item
    })
  } else {
    logger('info', ['sharePointList', 'No mapper defined in options'])
    throw new Error('No mapper defined in options for sharepointList. Please provide a custom mapper in flow definition')
  }

  let payload
  if (flowStatus.sharepointList.retryPayload) {
    logger('info', ['sharePointList', 'Retry payload is present. Will use it'])
    payload = flowStatus.sharepointList.retryPayload
  } else {
    payload = createBatchRequest(listItems)
    flowStatus.sharepointList.originalRequest = payload
  }
  let fileUploads
  if (flowStatus.sharepointList.fileUploads) {
    fileUploads = flowStatus.sharepointList.fileUploads
  } else { // første gang vi kjører
    fileUploads = []
  }

  const accessToken = await graphToken()
  const headers = {
    Authorization: `Bearer ${accessToken}`
  }

  let retryPayload = { requests: [] }
  let graphResult
  if (payload.requests.length > 0) {
    const { data } = await axios.post(`${graphUrl}/$batch`, payload, { headers })
    graphResult = data
    const batchRequests = repackBatchRequests(data, payload, listItems, flowStatus.parseXml.result.files)
    retryPayload = batchRequests.retryPayload
    fileUploads = [...fileUploads, ...batchRequests.uploadFileItems]
  } else logger('info', ['sharePointList', 'payload.request is empty. Moving on to file uploads'])

  const failedFileUploads = []
  for (const fileUpload of fileUploads) {
    try {
      logger('info', ['sharePointList', 'Starting file upload to SharePoint', 'fileName', fileUpload.file.name, 'fileDesc', fileUpload.file.desc, 'siteName', fileUpload.siteName])
      const sharepointToken = await getSharepointToken()
      const blobContent = await get(fileUpload.file.path, { ...blobOptions, encoding: 'base64' })
      const fileBuffer = Buffer.from(blobContent.data, 'base64')
      if (!fileUpload.siteName) throw new Error('Missing required property "siteName" in sharepointList in flow definition file')
      const baseUrl = `https://${sharepointClient.tenantName}.sharepoint.com/sites/${fileUpload.siteName}`
      const query = `_api/web/lists(guid'${fileUpload.listId}')/items(${fileUpload.spItemId})/AttachmentFiles/add(FileName='${fileUpload.file.desc}')`
      await axios.post(`${baseUrl}/${query}`, fileBuffer, { headers: { Authorization: `Bearer ${sharepointToken}`, Accept: 'application/json;odata=verbose' } })
      logger('info', ['sharePointList', 'Successfully uploaded file to SharePoint', 'fileName', fileUpload.file.name, 'fileDesc', fileUpload.file.desc, 'siteName', fileUpload.siteName])
    } catch (error) {
      failedFileUploads.push(fileUpload)
      const errorMsg = error.response?.data || error.stack || error.toString()
      logger('warn', ['sharePointList', 'Failed when uploading file to SharePoint', 'fileName', fileUpload.file.name, 'fileDesc', fileUpload.file.desc, 'siteName', fileUpload.siteName, 'error', errorMsg])
    }
  }

  if (retryPayload.requests.length > 0 || failedFileUploads.length > 0) {
    if (graphResult) flowStatus.sharepointList.graphResult = graphResult
    flowStatus.sharepointList.retryPayload = retryPayload
    flowStatus.sharepointList.fileUploads = failedFileUploads
    throw new Error(`Error creating ${retryPayload.requests.length} of ${payload.requests.length} items in SharePoint list. Error uploading ${failedFileUploads.length} of ${fileUploads.length} files to item in SharePoint list. See SharePoint.graphResult flow-status.json for more details`) // må hånteres allerledes (etter at evt vedlegg er lastet opp)
  }
  logger('info', ['sharePointList', `Successfully created ${payload.requests.length} list items`])

  return graphResult
}
