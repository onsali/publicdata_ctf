# Welcome to the 2023 Pennington CTF Challenge API!

This is a CRUD (mostly) REST based intentionally vulnerable API that was developed to teach college students on how sensitive data can be siphoned out of Public Data API's, and how common web application attacks are carried out. 

#### ⚠️  WORK IN PROGRESS ⚠️

## CTF Instructions:
- Navigate to the homepage 
- There are 5 flags to collect in total.

## Vulnerabilities/Exploitation Techniques:
- SQL injection
- API BOLA (Broken Object Level Authentication) - extracting sensitive information without access
- OSINT and data diving
- Linux CLI usage

## Usage:

`git clone`\
`cd public_data_`\
`npm install`\
`node server.js`

## Screenshot
![](https://github.com/onsali/publicdata_ctf/assets/64367557/93163915-d172-4a0d-86fc-5f94d375f1c3)

## To do:
- [ ] Shift Routes, and Middleware out of server.js
- [ ] Remove hardcoded SQLi vuln
- [ ] MD Documentation
