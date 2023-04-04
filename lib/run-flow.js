const parseXml = require('./jobs/parse-xml')
const syncElevmappe = require('./jobs/sync-elevmappe')
const syncEmployee = require('./jobs/sync-employee')
const syncPrivatePerson = require('./jobs/sync-private-person')
const handleCase = require('./jobs/handle-case')
const archive = require('./jobs/archive')
const signOff = require('./jobs/sign-off')
// const sharepointList = require('./jobs/sharepoint-list')
const { logger, logConfig } = require('@vtfk/logger')
const { save } = require('@vtfk/azure-blob-client')
const { storageAccount, retryIntervalMinutes } = require('../config')
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

/* Retries forklart

flowStatus.runs er antall ganger flowen HAR kjørt. Den inkrementeres hver gang et nytt forsøk er gjort
retryIntervals er en liste med hvor mange ganger vi skal prøve på nytt. Altså hvis lista er 3 lang, så skal vi totalt kjøre 4 ganger
For å slippe plusser og minuser legger vi derfor til et element først i retryIntervals for å representere den første kjøringen
Første kjøring er kjøring 1 - men runs inkrementeres ikke før vi er ferdige å prøve kjøringen.
Feilhåndteringen får så vite hvor mange ganger jobben er kjørt, og kan bruke flowStatus.runs som index for å sjekke hvor lenge vi skal vente til neste kjøring. Om (flowStatus.runs >= retryIntervals.length), så skal vi ikke prøve mer, og kan gi error-beskjed
Dispatcheren trenger så bare sjekke hvor mange ganger vi har kjørt - og om det er større eller likt antall ganger vi skal kjøre (retryIntervals.length siden den nå er like lang som antall ganger vi skal kjøre)

*/
const handleFailedJob = async (jobName, flowStatus, error) => {
  flowStatus.runs++
  const errorMsg = error.response?.data || error.stack || error.toString()
  flowStatus[jobName].error = errorMsg

  if (flowStatus.runs >= retryIntervalMinutes.length) {
    try {
      logger('error', ['Blob needs care and love', 'Failed in job', jobName, 'Runs:', `${flowStatus.runs}/${retryIntervalMinutes.length}`, 'Will not run again. Reset flowStatus.runs to try again', 'error:', errorMsg])
      await save(`${flowStatus.blobDir}/${flowStatus.refId}-flow-status.json`, JSON.stringify(flowStatus, null, 2), blobOptions)
    } catch (error) {
      logger('error', ['Dritt og møkk... vi fikk ikke lagret flowStatus til bloben. Ting vil potensielt bli kjørt dobbelt opp', 'jobben den stoppet på:', jobName, 'Error', error.stack || error.toString()])
    }
    return
  }
  const minutesToWait = retryIntervalMinutes[flowStatus.runs]
  const now = new Date()
  flowStatus.nextRun = new Date(now.setMinutes(now.getMinutes() + minutesToWait)).toISOString()
  try {
    logger('warn', ['Failed in job', jobName, 'Runs:', `${flowStatus.runs}/${retryIntervalMinutes.length} Will retry in ${minutesToWait} minutes`, 'error:', errorMsg])
    await save(`${flowStatus.blobDir}/${flowStatus.refId}-flow-status.json`, JSON.stringify(flowStatus, null, 2), blobOptions)
  } catch (error) {
    logger('error', ['Dritt og møkk... vi fikk ikke lagret flowStatus til bloben. Ting vil potensielt bli kjørt dobbelt opp', 'jobben den stoppet på:', jobName, 'Error', error.stack || error.toString()])
  }
}

module.exports = async (flowDef, flowStatus, blobs) => {
  // gå gjennom flowDef og kjøre alle jobbene som er definert i flowDef

  logConfig({
    prefix: `azf-acos-interact - run-flow - ${flowStatus.acosId} - ${flowStatus.acosName} - ${flowStatus.refId}`
  })
  {
    const jobName = 'parseXml'
    if (!flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await parseXml(blobs, flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'syncElevmappe'
    if (!flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await syncElevmappe(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'syncPrivatePerson'
    if (!flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await syncPrivatePerson(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'syncEmployee'
    if (!flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await syncEmployee(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'handleCase'
    if (!flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await handleCase(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'archive'
    if (!flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await archive(flowDef[jobName], flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  {
    const jobName = 'signOff'
    if (!flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        const result = await signOff(flowStatus)
        flowStatus[jobName].result = result
        flowStatus[jobName].jobFinished = true
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }

  // TODO after Easter eggs 🥚🥚🥚🥚: Sette opp jobb for avslutt sak
  {
    const jobName = 'failOnPurpose'
    if (!flowStatus.failed && flowDef[jobName]?.enabled && !flowStatus[jobName]?.jobFinished) {
      if (!flowStatus[jobName]) flowStatus[jobName] = { jobFinished: false }
      try {
        throw new Error('Æ feeijla med vilje!')
      } catch (error) {
        flowStatus.failed = true
        handleFailedJob(jobName, flowStatus, error)
      }
    }
  }
  // syncElevmappe
  // Pass på at jobben ikke kjører om den allerede har feilet
  // sjekke om jobben skal kjøres
  // sende med nødvendig flowStatus for å kjøre jobben

  return flowDef
}
