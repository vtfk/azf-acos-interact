const description = 'Søknad om annullering av eksamen etter UDIRs eksamensfadese 2023, oppretter rad i SharePoint liste for seksjonen'
module.exports = {
  config: {
    enabled: true,
    doNotRemoveBlobs: true
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML')
        return [
          {
            testSiteId: '8814d65c-b4bd-4859-998f-63ba9b3f1f10',
            testSiteName: 'OF-OF-Eksamensansvarlige',
            testPath: 'sites/OF-OF-Eksamensansvarlige/Lists/TEST%20%20Annullering%20eleveksamen/AllItems.aspx',
            testListId: '1c5fd914-4006-4536-953a-6ebbdf806d44',
            testListName: 'TEST - Annullering eleveksamen',
            prodSiteId: '8814d65c-b4bd-4859-998f-63ba9b3f1f10',
            prodSiteName: 'OF-OF-Eksamensansvarlige',
            prodPath: 'sites/OF-OF-Eksamensansvarlige/Lists/Annullering%20eleveksamen/AllItems.aspx',
            prodListId: '48658c48-d623-4c1f-bae7-35e01a24e933',
            prodListName: 'Annullering eleveksamen',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummer: xmlData.Postnr,
              Sted: xmlData.Poststed,
              Mobilnummer: xmlData.Mobilnr,
              E_x002d_post: xmlData.Epost,
              Klasse: xmlData.Klasse,
              Skole: xmlData.Skole,
              Eksamenskode: xmlData.Fagkode
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
        const xmlData = flowStatus.parseXml.result.ArchiveData
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier
        return {
          company: 'OF',
          department: 'EKSAMEN',
          description,
          type: 'Annullering av eksamen', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Klasse: xmlData.Klasse,
          Skole: xmlData.Skole,
          Fagkode: xmlData.Fagkode
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
