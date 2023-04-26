module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  
  // Fyller en eksisterende SP-liste med data fra Acos-skjema. Ett element i lista returnert fra mapper-funksjonen blir en rad i SP-lista, dvs at ett innsendt skjema blir en rad i SP-lista.
  sharepointList: {
    enabled: true,
    options:{
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example   
        return [
          {
            siteId: '0a4121ce-7384-474c-afff-ee20f48bff5e',
            siteName: 'BDK-Jrgensteste-team',
            path: 'sites/BDK-Jrgensteste-team/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            listId: 'D1085908-9111-4b6d-84d3-fc8ecd29d398',
            listName: 'Acos test',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil,
              E_x002d_postadresse: xmlData.Epost,
              Typedokumentasjon: xmlData.TypeDok,
              Typeautorasisjon: xmlData.TypeAut,
              Eksamenssted: xmlData.Eksamenssted,
              Fag: xmlData.Fag,
              _x00d8_nsketmottak: xmlData.OnsketMottak,
              Eksamensperiode: xmlData.AarSemester,
              Alternativadresse: xmlData.AltAdresse
            }
          }
        ]
      }
    }
  },
  // Fyller to eksisterende SP-lister med data fra Acos-skjema. Ett element i lista returnert fra mapper-funksjonen blir en rad i hver SP-liste, dvs at ett innsendt skjema blir en rad i hver av SP-listene.
  sharepointList2: {
    enabled: true,
    options:{
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        if (!xmlData.Postnr) throw new Error('Postnr har ikke kommet med fra XML') // validation example   
        return [
          {
            siteId: '0a4121ce-7384-474c-afff-ee20f48bff5e',
            siteName: 'BDK-Jrgensteste-team',
            path: 'sites/BDK-Jrgensteste-team/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            listId: 'D1085908-9111-4b6d-84d3-fc8ecd29d398',
            listName: 'Acos test',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil,
              E_x002d_postadresse: xmlData.Epost,
              Typedokumentasjon: xmlData.TypeDok,
              Typeautorasisjon: xmlData.TypeAut,
              Eksamenssted: xmlData.Eksamenssted,
              Fag: xmlData.Fag,
              _x00d8_nsketmottak: xmlData.OnsketMottak,
              Eksamensperiode: xmlData.AarSemester,
              Alternativadresse: xmlData.AltAdresse
            }
          },
          {
            siteId: 'en annen siteId',
            siteName: 'BDK-Jrgensteste-team2',
            path: 'sites/BDK-Jrgensteste-team2/Lists/ACOS%20test%20%20Bestilling%20av%20dokumentasjon%20for%20privati/AllItems.aspx',
            listId: 'en annen listId',
            listName: 'Acos test2',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavn: xmlData.Fornavn,
              Etternavn: xmlData.Etternavn,
              Adresse: xmlData.Adresse,
              Postnummerogsted: `${xmlData.Postnr} ${xmlData.Poststed}`,
              Mobil: xmlData.Mobil
            }
          }
        ]
      }
    }
  },

  // Fyller en eksisterende SP-liste med data fra Acos-skjema. Hvert element i lista returnert fra mapper-funksjonen blir en rad SP-lista, dvs at ett innsendt skjema blir like mange rader som faglista fra XML er lang i SP-lista.
  sharepointList3: {
    enabled: true,
    options:{
      mapper: (flowStatus) => {
        const xmlData = flowStatus.parseXml.result.ArchiveData
        const sharepointElements =  []
        const fagliste = Array.isArray(xmlData.ValgteFag.fagliste) ? xmlData.ValgteFag.fagliste : [xmlData.ValgteFag.fagliste] // Sjekker om det er mer enn ett fag i lista (altså et array). Hvis ikke lag et array med det ene elementet
        for (const fag of fagliste) {
          const sharepointElement = {
            siteId: '0a4121ce-7384-474c-afff-ee20f48bff5e',
            siteName: 'BDK-Jrgensteste-team',
            path: 'sites/BDK-Jrgensteste-team/Lists/Test%20%20Pmelding%20nettundervisning%20vgs/AllItems.aspx',
            listId: '76d4a6be-73f1-4c6a-baeb-feadb2b2decc',
            listName: 'Test - Påmelding nettundervisning vgs',
            uploadFormPdf: true,
            uploadFormAttachments: true,
            fields: {
              Title: xmlData.Fnr || 'Mangler fnr', // husk å bruke internal name på kolonnen
              Fornavnelev: xmlData.Fornavn,
              Etternavnelev: xmlData.Etternavn,
              Fylke: xmlData.Fylke,
              Skole: xmlData.Skole,
              Elevensmobilnr_x002e_: xmlData.Mobilnr,
              Elevensadresse: xmlData.Adresse,
              Elevenspostnr_x002e_: xmlData.Postnr,
              Elevenspoststed: xmlData.Poststed,
              Elevense_x002d_post: xmlData.Epost,
              Utfyltav: xmlData.UtfyltAv,
              Kontaktpersonensfornavn: xmlData.KontaktpersonFornavn,
              Kontaktpersonensetternavn: xmlData.KontaktpersonEtternavn,
              Fag: fag.Fagnavn
            }
          }
          sharepointElements.push(sharepointElement)
        }
        return sharepointElements
      }
    }
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
