module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  syncElevmappeFakeSsn: {
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette elevmappe med fiktivt fødselsnummer
        return {
          generateFakeSsn: true,
          birthdate: '230594',
          gender: 'M',
          firstName: 'Ola',
          lastName: 'Knudsen',
          streetAddress: 'Gata 5',
          zipCode: '4900',
          zipPlace: 'Stedet'
        }
      }
    }
  },
  syncElevmappe: {
    enabled: false,
    options: {
      mapper: (flowStatus) => {
        return {
          ssn: flowStatus.parseXml.result.skjemadata.Fnr
        }
      }
    }
  },
  syncEmployee: {
    enabled: false,
    options: {
      enOption: 'Hei',
      enTil: 'hå'
    }
  },
  handleCase: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        return {
          CaseType: 'Sak',
          Project: '20-15',
          Title: 'En sakstittel',
          UnofficialTitle: 'En sakstittel med noe snusk i seg som ikke skal vises til media',
          Status: 'B',
          JournalUnit: 'Sentralarkiv',
          SubArchive: 'Sakarkiv',
          ArchiveCodes: [
            {
              ArchiveCode: '035',
              ArchiveType: 'FELLESKLASSE PRINSIPP',
              Sort: 1
            }
          ],
          ResponsibleEnterpriseNumber: '821227062',
          ResponsiblePersonEmail: 'nils.thvedt@vtfk.no',
          AccessGroup: 'Alle'
        }
      },
      getCaseParameter: (flowStatus) => {
        return {
          CaseNumber: '23/00036' // 
        }
      },
    }
  },
  archive: {
    enabled: false,
    options: {
      mapper: (flowStatus, base64, attachments) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          system: 'acos',
          template: 'elevdocument-default',
          parameter: {
            organizationNumber: '974568098',
            documentDate: '2021-09-27',
            caseNumber: '20/05905',
            studentName: 'Ola Bredesen',
            responsibleEmail: 'jorgen.thorsnes@vtfk.no',
            accessGroup: 'Elev Bamble vgs',
            studentSsn: '16077939907',
            base64,
            documentTitle: 'Tittel',
            attachments
          }
        }
      }
    }
  },
  signOff: {
    enabled: false
  },
  statistics: {
    enabled: false,
    options: {
      enOption: true
    }
  },
  failOnPurpose: {
    enabled: true
  }
}
