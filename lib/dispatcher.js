const { list, get } = require('@vtfk/azure-blob-client')
const { storageAccount, retryIntervalMinutes } = require('../config')
const runFlow = require('../lib/run-flow')
const { readdirSync } = require('fs')
const { logger } = require('@vtfk/logger')

// takes in a list of blobs, sorts them on acosRefId and returns object indexed on acosRefId with coresponding blobs as value for the refId
const createRefIdCollections = (bloblist) => {
  const collections = {}
  for (const blob of bloblist) {
    const refId = blob.path.split('/')[1]
    if (!collections[refId] || !Array.isArray(collections[refId])) {
      collections[refId] = []
    }
    collections[refId].push(blob)
  }
  return collections
}

const mapFlowFile = (filename) => {
  const filenameList = filename.split('-')
  if (filenameList.length < 2) {
    logger('error', ['Flowfile with filename', filename, 'is not on valid format. Must be {acosId}-{acosName}.js'])
    filenameList.push('unknownAcosName')
  }
  return {
    filepath: `../flows/${filename}`,
    filename,
    acosId: filenameList[0],
    acosName: filenameList.slice(1, filenameList.length).join('-').replace('.js', '')
  }
}

module.exports = async () => {
  let processedRefIds = 0

  logger('info', ['Running dispatcher'])
  const blobOptions = {
    connectionString: storageAccount.connectionString,
    containerName: storageAccount.containerName
  }

  logger('info', ['Getting all schemas from ./flows'])
  const schemaNames = readdirSync('./flows').map(filename => mapFlowFile(filename))
  logger('info', [`Got ${schemaNames.length} schemas`])

  logger('info', ['Getting all flows'])
  const flows = []
  for (const schema of schemaNames) {
    try {
      const file = require(schema.filepath)
      if (file.config.enabled) {
        flows.push({ ...file, acosId: schema.acosId, acosName: schema.acosName })
      }
    } catch (error) {
      logger('error', ['Could not require schema flow file', schema.filepath, 'please verify that schema flow file is valid', error.toString(), error])
    }
  }
  logger('info', [`Got ${flows.length} flows`])
  let refIdCollections
  for (const flowDef of flows) {
    logger('info', ['Getting blobs for', flowDef.acosId, flowDef.acosName])
    try {
      const blobs = await list(flowDef.acosId, blobOptions)
      refIdCollections = createRefIdCollections(blobs)
    } catch (error) {
      logger('error', ['Could not get blobs', error.toString(), error])
    }

    for (const [refId, blobs] of Object.entries(refIdCollections)) {
      let flowStatus
      if (blobs.length === 0) throw new Error(`Ingen blober for ${refId} Dette skal ikke skje!`)
      const blobPathList = blobs[0].path.split('/')
      const blobDir = blobPathList.slice(0, blobPathList.length - 1).join('/')
      try {
        const flowStatusBlob = blobs.find(blob => blob.name === `${refId}-flow-status.json`)
        const now = new Date()
        if (!flowStatusBlob) {
          logger('info', ['Could not find flowStatusBlob. Probably first run.', 'Creating new', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
          flowStatus = {
            createdTimeStamp: now,
            flowFinished: false,
            failed: false,
            refId,
            acosId: flowDef.acosId,
            acosName: flowDef.acosName,
            blobDir: blobDir,
            runs: 0,
            nextRun: now.toISOString()
          }
        } else {
          logger('info', ['Found flowStatusBlob.', 'Fetching blob data'])
          const { data } = await get(flowStatusBlob.path, blobOptions)
          flowStatus = JSON.parse(data)
          if (now < new Date(flowStatus.nextRun)) {
            logger('info', ['Not ready for retry', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
            continue
          }
          if (flowStatus.runs >= retryIntervalMinutes.length) {
            logger('warn', ['Blob will not run again. Runs', `${flowStatus.runs}/${retryIntervalMinutes.length}`, 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
            continue // blob has failed too many times
          }
          flowStatus.failed = false // Blob is now ready to run again
        }
      } catch (error) {
        logger('error', ['Failed when creating or getting flow status', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId, error.toString(), error])
        continue
      }
      await logger('info', ['Running flow', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId])
      try {
        await runFlow(flowDef, flowStatus, blobs)
      } catch (error) {
        logger('error', ['Flow failed. Something is very wrong! Please wake up and do something! Now!', 'AcosId', flowDef.acosId, 'AcosName', flowDef.acosName, 'refId', refId, error.toString(), error])
      }
      processedRefIds++
    }
  }
  logger('info', ['Dispatcher finished', 'Processed refIds', processedRefIds])
  return 'run finished'
}

// Finne alle acos skjemaID som er satt til options.environment   FERDIG
// for hver skjemaID; hent alle innsendte skjema (alle "mapper") FERDIG
// for hvert innsendte skjema; send alle filene videre til handleFlow FERDIG
// send varsel dersom det ligger skjemaer der som ikke er definert i hverken test eller prod
