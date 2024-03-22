const description = 'Søknad om oppsett av reklame rettet mot fylkesveg Skal opprettes en ny sak pr skjema'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true
  },

  /* XML from Acos:
ArchiveData {
    string Fnr
    string OrgNr
    string OmReklamen
    string Kommune
    string Veg
    string Egendefinert1 // inneholder Privatperson eller Organisasjon
    string Egendefinert2
    string Egendefinert3
}

}

  */
  syncPrivatePersonInnsender: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.Egendefinert1 === 'Privatperson'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },
  syncEnterprise: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.Egendefinert1 === 'Organisasjon'
      },
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.ArchiveData.OrgNr.replaceAll(' ', '')
        }
      }
    }
  },
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (xmlData.Egendefinert1 !== 'Privatperson' && xmlData.Egendefinert1 !== 'Organisasjon') throw new Error('Egendefinert1 må inneholde enten Privatperson eller Organisasjon')
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: nodeEnv === 'production' ? '24-100' : '23-16', // Må lages nytt prosjekt for Prod i 2024,
            Title: `${xmlData.Veg} - ${xmlData.Kommune} - Søknad om reklame`,
            Status: 'B',
            AccessCode: 'U',
            JournalUnit: 'Sentralarkiv',

            ArchiveCodes: [
              {
                ArchiveCode: 'Q84',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 1
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200018' : '200023' // Team veiforvaltning
          }
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: {
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        const p360Attachments = attachments.map(att => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: 'F',
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        return {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '7',
            Paragraph: 'Offl. § 7d',
            AccessGroup: 'Seksjon Vegforvaltning',
            Category: 'Dokument inn',
            Contacts: [
              {
                Role: 'Avsender',
                ReferenceNumber: xmlData.Egendefinert1 === 'Privatperson' ? xmlData.Fnr : xmlData.OrgNr.replaceAll(' ', ''), // Hvis privatperson skal FNR benyttes, hvis ikke skal orgnr brukes
                IsUnofficial: false
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: `${xmlData.Veg} - ${xmlData.Kommune} - Søknad om reklame`,
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200018' : '200023', // Seksjon Vegforvaltning
            Status: 'J',
            Title: `${xmlData.Veg} - ${xmlData.Kommune} - Søknad om reklame`,
            Archive: 'Saksdokument',
            CaseNumber: caseNumber
          }
        }
      }
    }
  },

  signOff: {
    enabled: false
  },

  closeCase: {
    enabled: false
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samferdsel',
          department: 'Seksjon Vegforvaltning',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om reklame', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber, // Optional. anything you like
          kommune: xmlData.Kommune,
          veg: xmlData.Veg
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
