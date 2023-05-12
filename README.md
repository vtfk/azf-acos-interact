# azf-acos-interact
Azure functions for handling Acos files

## Navnestandard for nye flows:
{AcosskjemaID}-{skjemanavn}
VTFK0236-Kartleggingssamtale

## Sette opp ny skjemaavlevering:
1. Opprett en ny js-flowfil i ./flows på formen `{AcosId}-{Navn på skjema}.js` Det enkleste er å kopiere fra et lignende skjema som er i drift og gi dette et nytt navn.
2. Sette opp jobbene som skal kjøres i filen som ble laget i pkt. 1. Eksempel på ulike jobber finner du i mappen ./example-flows
3. Test lokalt. Rett feil og sett i prod (commit -> push -> jrelease *patch || minor || major*)

## finishFlow
finishFlow vil alltid være enabled. Denne sletter blobene hvis man ikke definerer noe annet i options

## Deploy to Azure
- Create Azure Function on an App Service Plan
- Enable authentication on Azure Function and create or connect to an App Registration
  - The App registration created will be used for requests towards other Azure AD protected resources
  - Give the App registration application API permissions for
    - Microsoft Graph
      - Sites.ReadWrite.All
      - User.Read
    - SharePoint
      - Sites.ReadWrite.All
  - Remember to grant admin consent for the permissions
- Make sure you have a valid certificate that can be used for SharePoint requests. Can be [created as a self signed certificate in an Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/certificates/quick-create-portal#add-a-certificate-to-key-vault)
  - Upload certificate as pfx to an Azure Key Vault (if you did not create it there)
  - Upload the public key for the certificate to the App registration (to be used for SharePoint requests) Download in CER format in Key Vault
  - Create a client secret on the App registration (to be used for Graph requests)
  - Enable Managed Identity (System assigned) on the Azure Function and give it access to secrets from Key Vault (Access policies). Get and List on Secret permissions
- Set up the Azure Function configuration coresponding to you local.settings.json
  - First set up the certificate in the configuration
    - Get the reference to the certificate from Key Vault (copy the Secret identifier from the certificate) [use Key Vault references](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references?tabs=azure-cli)
    - create a configuration key called SP_PFX_BASE64 and paste in the Secret identifier as the value (@Microsoft.KeyVault(SecretUri={Secret Identifier you have copied}))
        - if you always want the Azure function to fetch the latest version of the certificate / secret, remove the id from the Secret Identifier uri. Example: https://myvault.vault.azure.net/secrets/mysecret/
    - save the configuration ans check that the connection to Key Vault is valid (save, refresh page and see connection status inside the key)
  - then the rest:
```json

{
  "IsEncrypted": false,
  "Values": {
    "STORAGE_ACCOUNT_CONNECTION_STRING": "connection string to storage account",
    "STORAGE_ACCOUNT_CONTAINER_NAME": "name of blob storage container",
    "RETRY_INTERVALS_MINUTES": "1,5,30,240", // number of retry intervals in minutes
    "ARCHIVE_SUBSCRIPTION_KEY": "subscription key",
    "ARCHIVE_URL": "archive api url",
    "STATISTICS_SUBSCRIPTION_KEY": "subscription key",
    "STATISTICS_URL": "url to statistics api",
    "GRAPH_CLIENT_ID": "app registration client id",
    "GRAPH_CLIENT_SECRET": "app registration client secret",
    "GRAPH_TENANT_ID": "your tenant id",
    "GRAPH_SCOPE": "graph scope",
    "GRAPH_URL": "url to graph",
    "SP_TENANT_NAME": "name of sharePoint tenant",
    "SP_PFX_BASE64": "reference to the certificate in key vault",
    "SP_PFX_THUMBPRINT": "certificate thumbprint",
    "NODE_ENV": "dev or production", 
    "ROBOT_EMAIL": "robot@domene.no",
    "TEAMS_WEBHOOK_URL": "teams webhook url",
    "ROOMSERVICE_TEAMS_WEBHOOK_URL": "webhook url for roomservice reports",
    "PAPERTRAIL_HOST": "papertrail.example.com/v1/log", // optional. NODE_ENV must be production for logging to PaperTrail
    "PAPERTRAIL_TOKEN": "jvkuvuyoufyofo8ygo8f609fo7ouyvcio7=" // optional
  }
}
```
- deploy the code with your prefered method