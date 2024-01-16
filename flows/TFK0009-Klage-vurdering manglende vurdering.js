const description = 'Sender til elevmappe'
const { nodeEnv } = require('../config')
const title = 'Klage - vurdering/manglende vurdering'
const { schoolInfo } = require('../lib/data-sources/tfk-schools')
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },

  // Synkroniser elevmappe
  syncElevmappe: {
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      }
    }
  },

  // Arkiverer dokumentet i elevmappa
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      /*
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TilArkiv === 'true'
      },
      */
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const elevmappe = flowStatus.syncElevmappe.result.elevmappe
        const p360Attachments = attachments.map(att => {
          return {
            Base64Data: att.base64,
            Format: att.format,
            Status: 'F',
            Title: att.title,
            VersionFormat: att.versionFormat
          }
        })
        const documentData = {
          service: 'DocumentService',
          method: 'CreateDocument',
          parameter: {
            AccessCode: '13',
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.Fnr,
                Role: 'Avsender',
                IsUnofficial: true
              }
            ],
            DocumentDate: new Date().toISOString(),
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: title,
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Paragraph: 'Offl. § 13 jf. fvl. § 13 (1) nr.1',
            Status: 'J',
            Title: title,
            // UnofficialTitle: '',
            Archive: 'Sensitivt elevdokument',
            CaseNumber: elevmappe.CaseNumber
          }
        }

        if (xmlData.Egendefinert1 === 'Privatist') {
          documentData.parameter.ResponsibleEnterpriseRecno = nodeEnv === 'production' ? '200471' : '200250' // Seksjon Sektorstøtte, inntak og eksamen
          documentData.parameter.AccessGroup = 'Eksamen'
        } else if (xmlData.Egendefinert1 === 'Elev') {
          const school = schoolInfo.find(school => school.orgNr.toString() === xmlData.SkoleOrgNr)
          if (!school) throw new Error(`Could not find any school with orgNr: ${xmlData.SkoleOrgNr}`)
          documentData.parameter.ResponsibleEnterpriseNumber = xmlData.SkoleOrgNr
          documentData.parameter.AccessGroup = school.tilgangsgruppe
        } else if (xmlData.Egendefinert1 === 'Lærling/lærekandidat/praksiskandidat') {
          documentData.parameter.ResponsibleEnterpriseRecno = nodeEnv === 'production' ? '200472' : '200249', // Seksjon Fag- og yrkesopplæring
          documentData.parameter.AccessGroup = 'Fagopplæring'
        } else if (xmlData.Egendefinert1 === 'Voksen (Talenthuset)') {
          documentData.parameter.ResponsibleEnterpriseRecno = nodeEnv === 'production' ? '200693' : 'Finnes ikke i test' // Talenthuset // denne er ikke verifisert
          documentData.parameter.AccessGroup = 'Elev Talenthuset'
        } else {
          throw new Error('Fikk ukjent verdi inn i Egendefinert1 fra skjemaets xml-fil. Trenger "Privatist", "Elev", "Lærling/lærekandidat/praksiskandidat" eller "Voksen (Kompetansebyggeren)"')
        }
        console.log(documentData)
        return documentData
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
        // const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Opplæring',
          department: 'FAGOPPLÆRING',
          description,
          type: title, // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          tilArkiv: flowStatus.parseXml.result.ArchiveData.TilArkiv,
          documentNumber: flowStatus.archive?.result?.DocumentNumber || 'tilArkiv er false' // Optional. anything you like
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
