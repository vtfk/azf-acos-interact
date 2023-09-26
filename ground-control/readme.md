# Ground control (local job/script)
## Description
A script that pulls files from ground-control storage account and saves them to local disk. Created for being able to have "lokal avlevering" when ACOS shuts that down...

## Flyt
![image](https://github.com/vtfk/azf-acos-interact/assets/25528003/7a0da8c0-eb37-4dc5-9e7f-6bef57702321)


## Setup
Create .env file within this directory (./ground-control/.env) with values
```bash
GROUND_CONTROL_STORAGE_ACCOUNT_CONNECTION_STRING="connection string" # same as in local.settings.json
GROUND_CONTROL_STORAGE_ACCOUNT_CONTAINER_NAME="container name" # same as in local.settings.json
AVLEVERING_ROOT="path to root directory for lokal avlevering files"
NODE_ENV="production" # For logging to remote to work
PAPERTRAIL_HOST="host" # Optional (for logging remote), same as in local.settings.json
PAPERTRAIL_TOKEN="token" # Optional (for logging remote), same as in local.settings.json
TEAMS_WEBHOOK_URL="webhook url" # Optional (for warnings and errors to Teams), same as in local.settings.json
```

Install dependencies
```bash
npm i
```

Create the path set in AVLEVERING_ROOT if it doesnt exist

## Run
```sh
cd ./ground-control
node ./index.js
```
