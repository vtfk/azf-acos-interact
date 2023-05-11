const { mapFlowFile } = require('../lib/dispatcher')
const { readdirSync } = require('fs')

describe('Checking flowfile', () => {
  const schemaNames = readdirSync('./flows').map(filename => mapFlowFile(filename))
  test.each(schemaNames)('$filename', (flow) => {
    const file = require(flow.filepath)
    expect(file.config).toBeTruthy()
    expect(file.parseXml).toBeTruthy()
  })
})
