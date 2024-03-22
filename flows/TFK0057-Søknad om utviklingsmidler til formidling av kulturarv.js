const description = 'Søknad om utviklingsmidler til formidling av kulturarv'
const { nodeEnv } = require('../config')

/* 
XML from Acos:
AArchiveData {
    string Fnr
    string OrgNr
    string TypeSoker
    string ProsjekBeskrivelse
    string OrgNavn
    string Fornavn
    string Etternavn
    string Telefonnummer
    string Epost
    string ProsjektNavn
    string Beløp
}
*/

module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: false
  },
  parseXml: {
    enabled: true
  },

  syncPrivatePerson: {
    enabled: true,
    options: {
      condition: (flowStatus) => { // use this if you only need to archive some of the forms.
        return flowStatus.parseXml.result.ArchiveData.TypeSoker === 'som privatperson'
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
        return flowStatus.parseXml.result.ArchiveData.TypeSoker === 'på vegne av en organisasjon'
      },
      mapper: (flowStatus) => { // for å opprette/oppdatere en virksomhet i P3360
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette privatperson med fiktivt fødselsnummer
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
        return {
          service: 'CaseService',
          method: 'CreateCase',
          parameter: {
            CaseType: 'Sak',
            Project: nodeEnv === 'production' ? '24-357' : '24-1', // Dette er riktig for telemark
            Title: `Søknad om utviklingsmidler til formidling av kulturarv - ${flowStatus.parseXml.result.ArchiveData.ProsjektNavn}`,
            // UnofficialTitle: ,
            Status: 'B',
            JournalUnit: 'Sentralarkiv',
            SubArchive: 'Sakarkiv',
            ArchiveCodes: [
              {
                ArchiveCode: '223',
                ArchiveType: 'FELLESKLASSE PRINSIPP',
                Sort: 1
              },
              {
                ArchiveCode: 'C50',
                ArchiveType: 'FAGKLASSE PRINSIPP',
                Sort: 2
              }
            ],
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200028',
            // ResponsiblePersonEmail: '',
            AccessGroup: 'Alle'
          }
        }
      }
    }
  },
  // Arkiverer dokumentet i 360
  archive: { // archive må kjøres for å kunne kjøre signOff (noe annet gir ikke mening)
    enabled: true,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const caseNumber = flowStatus.handleCase.result.CaseNumber
        let sender
        if (flowStatus.parseXml.result.ArchiveData.TypeSoker === 'på vegne av en organisasjon') {
          sender = xmlData.OrgNr.replaceAll(' ', '')
        } else {
          sender = xmlData.Fnr
        }
        // const caseNumber = nodeEnv === 'production' ? 'må fylles inn!' : '23/00115'
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
                ReferenceNumber: sender,
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
                Title: 'Søknad om utviklingsmidler til formidling av kulturarv',
                VersionFormat: 'A'
              },
              ...p360Attachments
            ],
            Status: 'J',
            DocumentDate: new Date().toISOString(),
            Title: `Søknad om utviklingsmidler til formidling av kulturarv - ${flowStatus.parseXml.result.ArchiveData.ProsjektNavn}`,
            // UnofficialTitle: 'Søknad om.....',
            Archive: 'Saksdokument',
            CaseNumber: caseNumber,
            ResponsibleEnterpriseRecno: nodeEnv === 'production' ? '200023' : '200028', // Seksjon Kultur Dette finner du i p360, ved å trykke "Avansert Søk" > "Kontakt" > "Utvidet Søk" > så søker du etter det du trenger Eks: "Søkenavn": %Idrett%. Trykk på kontakten og se etter org nummer.
            // ResponsiblePersonEmail: '',
            AccessCode: '26',
            Paragraph: 'Offl. § 26 femte ledd',
            AccessGroup: 'Kulturarv'
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        return [
          {
            testListUrl: 'https://telemarkfylke.sharepoint.com/sites/SAMU-Tilskuddsordningerkulturseksjonen/Lists/Sknad%20om%20utviklingsmidler%20til%20formidling%20av%20kultur/AllItems.aspx',
            prodListUrl: 'https://telemarkfylke.sharepoint.com/sites/SAMU-Tilskuddsordningerkulturseksjonen/Lists/Sknad%20om%20utviklingsmidler%20til%20formidling%20av%20kultur/AllItems.aspx',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.TypeSoker === 'på vegne av en organisasjon' ? xmlData.OrgNavn : `${xmlData.Fornavn} + ${xmlData.Etternavn}`, // Søker feltet
              Prosjektnavn: xmlData.ProsjektNavn,
              Beskrivelse: xmlData.ProsjekBeskrivelse,
              Telefonnummer: xmlData.Telefonnummer,
              Epost: xmlData.Epost,
              S_x00f8_knadsbel_x00f8_p: xmlData.Beløp
            }
          }
        ]
      }
    }
  },

  statistics: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'Samfunnsutvikling',
          department: 'Kulturarv',
          description, // Required. A description of what the statistic element represents
          type: 'Søknad om utviklingsmidler til formidling av kulturarv' // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          //   documentNumber: flowStatus.archive.result.DocumentNumber // Optional. anything you like
        }
      }
    }
  },
  failOnPurpose: {
    enabled: false
  }
}
