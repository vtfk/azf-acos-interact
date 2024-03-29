const { get } = require('@vtfk/azure-blob-client')
const { storageAccount } = require('../../config')
const { logger } = require('@vtfk/logger')
const xml2js = require('xml2js')
const blobOptions = {
  connectionString: storageAccount.connectionString,
  containerName: storageAccount.containerName
}

const xmlParser = new xml2js.Parser({ explicitArray: false })

module.exports = async (blobs, flowStatus) => {
  let result = {}
  {
    logger('info', ['parse-xml', 'Running function', 'egendefinert avleveringsfil'])
    const excludeBlobs = ['NetAxeptQueryResult.xml', '_WEBSAK_HODE.xml']
    const filteredXmlBlobs = blobs.filter(blob => {
      if (!blob.name.endsWith('.xml')) return false
      for (const excludeString of excludeBlobs) {
        if (blob.name.includes(excludeString)) return false
      }
      return true
    })
    if (filteredXmlBlobs.length === 0) throw new Error("Missing XML file. There's something wrong")
    if (filteredXmlBlobs.length > 1) throw new Error('More than one XML file. User has probably attached a xml file. Please check manually')

    const xmlBlob = filteredXmlBlobs[0]
    const { data } = await get(xmlBlob.path, blobOptions)
    const xmlData = await xmlParser.parseStringPromise(data)
    result = xmlData
    result.xmlFile = xmlBlob
    logger('info', ['parse-xml', 'Finished', 'egendefinert avleveringsfil', xmlBlob.name])
  }
  {
    logger('info', ['parse-xml', 'Running function', 'websak_hode.xml'])
    const websakHodeBlob = blobs.find(blob => blob.name.endsWith('_WEBSAK_HODE.xml'))

    if (!websakHodeBlob) throw new Error("Missing websakhode file. There's something wrong")

    const { data } = await get(websakHodeBlob.path, blobOptions)
    const xmlData = await xmlParser.parseStringPromise(data)
    const excludeFiles = ['NetAxeptQueryResult.xml', '_WEBSAK_HODE.xml']
    const filteredFiles = xmlData.WEBSAK_INN.OPERASJON_INN.PARAMETER.DOKUMENT.VEDLEGG.filter(file => {
      for (const excludeString of excludeFiles) {
        if (file._.includes(excludeString)) return false
      }
      return true
    })
    const files = filteredFiles.map(file => {
      const name = file.$.TYPE === 'H' ? 'Skjema.pdf' : file._
      const descString = file.$.BESK === name ? file.$.BESK : `${file.$.BESK}.${name.split('.').pop()}`
      const desc = file.$.TYPE === 'H' ? 'Skjema.pdf' : descString
      return {
        name,
        path: file.$.TYPE === 'H' ? `${flowStatus.blobDir}/${file._}` : `${flowStatus.blobDir}/${flowStatus.refId}_${file._}`,
        type: file.$.TYPE,
        desc
      }
    })
    result.files = files
    logger('info', ['parse-xml', 'Finished', 'websak_hode.xml', websakHodeBlob.name])
  }

  return result
}
