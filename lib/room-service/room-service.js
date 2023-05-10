const { list, get } = require('@vtfk/azure-blob-client')
const { logger, logConfig } = require('@vtfk/logger')
const { storageAccount, willNotRunAgainFilename } = require('../../config')
const { mapFlowFile } = require('../dispatcher')
const { readdirSync } = require('fs')
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}
module.exports = async () => {
  const blobsWithProblems = []
  const blobs = await list('*', blobOptions)
  const sortedBlobs = {}
  for (const blob of blobs) {
    const blobPathList = blob.path.split('/')
    if (blobPathList.length < 2) {
      blobsWithProblems.push(blob)
      continue
    }
    const acosId = blobPathList[0]
    const refId = blobPathList[1]
    if (!sortedBlobs[acosId]) sortedBlobs[acosId] = {}
    if (!sortedBlobs[acosId][refId]) sortedBlobs[acosId][refId] = []
    sortedBlobs[acosId][refId].push(blob)
  }
  const schemaNames = readdirSync('./flows').map(filename => mapFlowFile(filename))
  // sjekker at det ikke finnes blober med AcosID som ikke har en flow
  const missingFlowFile = []
  const willNotRunAgainBlobs = []
  for (const acosId of Object.keys(sortedBlobs)) {
    if (!schemaNames.some(flow => flow.acosId === acosId)) missingFlowFile.push(acosId)
    for (const [refId, blobs] of Object.entries(sortedBlobs[acosId])) {
      if (blobs.some(blob => blob.name === `${refId}-${willNotRunAgainFilename}.json`)) willNotRunAgainBlobs.push(`${acosId}/${refId}`)
    }
  }

  const teamsMsg = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: 'df74e3',
    summary: msg,
    sections: [
      {
        activityTitle: 'Statusrapport - ',
        activitySubtitle: 'MinElev må varsle dobbelt, for det kan plutselig bare stoppe... Det er kult',
        facts: [
          {
            name: 'Dokumenter i kø',
            value: count.toString()
          },
          {
            name: 'Status',
            value: msg
          }
        ],
        markdown: true
      }
    ]
  }

  try {
    await axios.post(webhookUrl, teamsMsg)
  } catch (error) {
    console.log(error)
  }

  return {
    missingFlowFile,
    blobsWithProblems,
    willNotRunAgainBlobs
  }
}

/*
  Kjører på gitt intervall (timer trigger)

  Sjekke at løsningen er oppe og går (håndteres egentlig av siste punkt (statusraporten)
    Hente alle blobber
      Sortere disse på AcosId og refId
    Hente alle flows
    Hente Acos ID for alle disse flowene (har funksjon for dette i dispatcher (mapFlowFile))
    Sjekke om det finnes noen blobber med en Acos ID som ikke finnes i flows
      Varlse hvis det finnes

  Sjekke hvor mange filer som har kjørt for mange ganger
  lage statusrapport og sende til Teams (ta gjerne med litt statistikk etterhvert)
  */
