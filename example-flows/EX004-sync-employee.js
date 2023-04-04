module.exports = {
  config: {
    enabled: true
  },
  parseXml: {
    enabled: true,
    options: {
    }
  },
  syncElevmappe: {
    enabled: true,
    options: {
      mapper: (flowStatus) => {
        // Mapping av verdier fra XML-avleveringsfil fra Acos. Alle properties under må fylles ut og ha verdier for å opprette elevmappe med fiktivt fødselsnummer
        return {
          generateFakeSsn: true,
          birthdate: flowStatus.parseXml.result.ArchiveData.Foedselsdato,
          gender: flowStatus.parseXml.result.ArchiveData.Kjoenn,
          firstName: flowStatus.parseXml.result.ArchiveData.Fornavn,
          lastName: flowStatus.parseXml.result.ArchiveData.Etternavn,
          streetAddress: flowStatus.parseXml.result.ArchiveData.Adresse,
          zipCode: flowStatus.parseXml.result.ArchiveData.Postnr,
          zipPlace: flowStatus.parseXml.result.ArchiveData.Sted
        }
      }
    }
  }
}
