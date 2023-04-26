# azf-acos-interact
Azure functions for handling Acos files

## Navnestandard for nye flows:
AcosskjemaID-skjemanavn
VTFK0236-Kartleggingssamtale

## Sette opp ny skjemaavlevering:
1. Opprett en ny js-flowfil i ./flows på formen `{AcosId}-{Navn på skjema}.js` Det enkleste er å kopiere fra et lignende skjema som er i drift og gi dette et nytt navn.
2. Sette opp jobbene som skal kjøres i filen som ble laget i pkt. 1. Eksempel på ulike jobber finner du i mappen ./example-flows
3. Test lokalt. Rett feil og sett i prod (commit -> push -> jrelease *patch || minor || major*)

## Scripts
For å få en oversikt over hvilke flower som er i drift, kjør npm run enabledFlows

## TODO
Slett filene når alt er OK