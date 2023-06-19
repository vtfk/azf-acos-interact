const description = 'Registrering av praksis for lærerstudenter'
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
  /*
XML file from Acos:
ArchiveData {
string Fnr
string Fornavn
string Etternavn
string Adresse
string Postnr
string Poststed
string Mobilnr
string Epost
string Skole
string TidsromFra
string TidsromTil
string Fag
string Veileder
}
*/

  sharepointList: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML')
        return [
          {
            testSiteId: 'bd1751d5-ad4d-48ab-aaf3-7d90df6da8f5',
            testPath: 'sites/RVS-PersonaletpRe2-Praksisstudenter/Lists/TEST%20%20Informasjon%20lrerstudenter/AllItems.aspx',
            testListId: 'a4e7becb-398e-4132-82e5-d14033a25394',
            prodSiteId: 'bd1751d5-ad4d-48ab-aaf3-7d90df6da8f5',
            prodPath: 'sites/RVS-PersonaletpRe2-Praksisstudenter/Lists/Studentinformasjon/AllItems.aspx',
            prodListId: '12bc5fa2-e0af-49f2-93cb-358f8ce67a14',
            uploadFormPdf: true,
            uploadFormAttachments: false,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummer: xmlData.Postnr,
              Poststed: xmlData.Poststed,
              Mobil: xmlData.Mobilnr,
              E_x002d_post: xmlData.Epost,
              Skole: xmlData.Skole,
              Tid_x003a_Fra: xmlData.TidsromFra,
              Tid_x003a_Til: xmlData.TidsromTil,
              Fag: xmlData.Fag,
              Veielder: xmlData.Veileder
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
          department: 'SKOLE',
          description,
          type: 'Registrering av lærerstudenter', // Required. A short searchable type-name that distinguishes the statistic element
          // optional fields:
          Fag: xmlData.Fag,
          Skole: xmlData.Skole
        }
      }
    }
  },

  failOnPurpose: {
    enabled: false
  }
}
