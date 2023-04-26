const retryList = (process.env.RETRY_INTERVALS_MINUTES && process.env.RETRY_INTERVALS_MINUTES.split(',').map(numStr => Number(numStr))) || [15, 60, 240, 3600]
retryList.unshift(0)
module.exports = {
  storageAccount: {
    connectionString: process.env.STORAGE_ACCOUNT_CONNECTION_STRING || 'En connection string',
    containerName: process.env.STORAGE_ACCOUNT_CONTAINER_NAME || 'navn på container skjema'
  },
  retryIntervalMinutes: retryList,
  archive: {
    url: process.env.ARCHIVE_URL || 'url to archive endpoint',
    subscriptionKey: process.env.ARCHIVE_SUBSCRIPTION_KEY || 'key to archive endpoint'
  },
  autoConvertFileFormats: ((process.env.AUTO_CONVERT_FILE_FORMATS && process.env.AUTO_CONVERT_FILE_FORMATS.split(',')) || ['JPG', 'JPEG', 'XLSX', 'XLS', 'RTF', 'MSG', 'PPT', 'PPTX', 'DOCX', 'DOC', 'PNG']).map(ext => ext.toLowerCase()),
  graphClient: {
    clientId: process.env.GRAPH_CLIENT_ID ?? 'superId',
    clientSecret: process.env.GRAPH_CLIENT_SECRET ?? 'hemmelig hemmelig',
    tenantId: process.env.GRAPH_TENANT_ID ?? 'tenant id',
    scope: process.env.GRAPH_SCOPE ?? 'etSkikkeligSkuup'
  },
  graphUrl: process.env.GRAPH_URL || 'tullballfinnes.sharepoint.com',
  sharepointClient: {
    clientId: process.env.GRAPH_CLIENT_ID ?? 'superId',
    tenantId: process.env.GRAPH_TENANT_ID ?? 'tenant id',
    tenantName: process.env.SP_TENANT_NAME ?? 'vtfk',
    pfxPath: process.env.SP_PFX_PATH ?? '',
    pfxBase64: process.env.SP_PFX_BASE64 ?? '',
    pfxPassphrase: process.env.SP_PFX_PASSPHRASE ?? null,
    pfxThumbprint: process.env.SP_PFX_THUMBPRINT ?? ''
  },
  nodeEnv: process.env.NODE_ENV ?? 'dev',
  robotEmail: process.env.ROBOT_EMAIL ?? 'robot@robot.com'
}
