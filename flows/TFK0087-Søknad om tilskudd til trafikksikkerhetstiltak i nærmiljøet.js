const description = 'TFK0087-Søknad om tilskudd til trafikksikkerhetstiltak i nærmiljøet'
const { nodeEnv } = require('../config')

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
  },
  parseXml: {
    enabled: true
  },
  syncPrivatePerson: {
    enabled: false,
    options: {
      mapper: (flowStatus) => { // for å opprette person basert på fødselsnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          ssn: flowStatus.parseXml.result.ArchiveData.Fnr
        }
      },
    }
  },
  syncEnterprise: {
    enabled: false,
    options: {
      mapper: (flowStatus) => { // for å opprette organisasjon basert på orgnummer
        // Mapping av verdier fra XML-avleveringsfil fra Acos.
        return {
          orgnr: flowStatus.parseXml.result.Soknad.Orgnr.replaceAll(' ', '')
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  handleProject: {
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        return {
          service: 'ProjectService',
          method: 'CreateProject',
          parameter: {
            Title: `Trafikksikkerhetstiltak i nærmiljøet 2024`,
            ResponsiblePersonEmail: 'anncarin.risinggaard@telemarkfylke.no',
            Contacts: [
              {
                Role: 'Kontakt',
                ReferenceNumber: flowStatus.parseXml.result.someData.fnr
              }
            ]
          }
        }
      },
      getProjectParameter: (flowStatus) => {
        return {
          Title: "Trafikksikkerhetstiltak i nærmiljøet 2024"
          //Title: `Prosjektet til Robin -${flowStatus.parseXml.archiveData.lastName}` // check for exisiting project with this title
        }
      },
      getProjectParameter2: (flowStatus) => {
        return {
          ExternalId: flowStatus.parseXml.archiveData.guid // check for exisiting project with external ID
        }
      },
      getProjectParameter3: (flowStatus) => {
        return {
          ProjectNumber: '24-485' // archive to this project only (project number defined here) (samleprosjekt)
        }
      },
      getProjectParameter4: (flowStatus) => {
        return {
          ProjectNumber: flowStatus.parseXml.someData.projectNumber // archive to this project only (project number from Acos XML) (samlesak)
        }
      }
    }
  },
  archive: {
    enabled: false,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.Soknad
        let caseNumber
        if (flowStatus.parseXml.result.Soknad.Type === 'Søknad om tilskudd til trafikksikkerhetstiltak i nærmiljøet') {
          caseNumber = nodeEnv === 'production' ? '24/03961' : '24/00005' // Prod : Test
        } else if (flowStatus.parseXml.result.Soknad.Type === 'Tilskudd til regionale idrettsanlegg') {
          caseNumber = nodeEnv === 'production' ? '24/03963' : '24/00006'
        } else {
          throw new Error('Type tilskudd er feil eller har ikke kommet med')
        }
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
            Category: 'Dokument inn',
            Contacts: [
              {
                ReferenceNumber: xmlData.Orgnr.replaceAll(' ', ''),
                Role: 'Avsender',
                IsUnofficial: false
              }
            ],
            Files: [
              {
                Base64Data: base64,
                Category: '1',
                Format: 'pdf',
                Status: 'F',
                Title: 'Søknad om tilskudd til rafikksikkerhetstiltak i nærmiljøet 2024',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om tilskudd til rafikksikkerhetstiltak i nærmiljøet 2024 – ${xmlData.ArrAnlNavn}`,
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200028', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            AccessCode: 'U',
            Paragraph: '',
            AccessGroup: 'Alle'
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
  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.Soknad
        // if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example
        return [
          {
            testListUrl: 'https://telemarkfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/soknaderTilskuddTrafikksikkerhetstiltak/AllItems',
            prodListUrl: 'https://telemarkfylke.sharepoint.com/sites/SAMF-Samferdselsektorteam/Lists/soknaderTilskuddTrafikksikkerhetstiltak/AllItems',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Navn: xmlData.Navn,
              Epost: xmlData.Epost,
              Soknadstype: xmlData.Type,	
              Tiltak: xmlData.Tiltak,
              Totalkostnad: xmlData.Totalkostnad,
              Soknadsbelop: xmlData.Soknadsbelop,
              Egenfinansiering: xmlData.Egenfinansiering,
              Beskrivelse: xmlData.Beskrivelse,
              Forslag: xmlData.Forslag,
              AndreOpplysninger: xmlData.AndreOpplysninger,
              OrgNavn: xmlData.OrgNavn,
              reserve2: xmlData.reserve2,
            }
          }
        ]
      }
    }
  },
  statistics: {
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Kultur',
          department: '',
          description, // Required. A description of what the statistic element represents
          type: 'Tilskudd til idrettsarrangement og regionale idrettsanlegg', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
