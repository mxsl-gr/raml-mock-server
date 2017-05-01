const raml2obj = require('raml2obj');
const express = require('express')
const app = express()

const paramUrlRegex = /\{([^\{]*)\}/g

// TODO param enum
function addMockApi(r){
  let apiPath = r.parentUrl + r.relativeUri
  apiPath = apiPath.replace(paramUrlRegex, ':$1')
  r.methods && r.methods.forEach((m) => {
    const responseMap = {}
    console.log(m.method, apiPath)
    m.responses && m.responses.forEach(response => {
      if(response.body && response.body[0].examples){
        responseMap[response.code] = response.body[0].examples[0].value
      }else {
        // TODO fake data
        responseMap[response.code] = {}
      }
    })
    app[m.method](apiPath, (req, res) => {
      const code = req.query['__code']
      m.allUriParameters && m.allUriParameters.forEach(uriParam => {
        if(uriParam.required && req.params[uriParam.key] === undefined){
          res.status(400).send(`url param [${uriParam.key}] is required`)
        }
      })
      m.queryParameters && m.queryParameters.forEach(queryParam => {
        if(queryParam.required && req.query[queryParam.key] === undefined){
          res.status(400).send(`query param [${queryParam.key}] is required`)
        }
      })
      // m.body.forEach(field => {

      // })
      if (code && responseMap[code]) {
        res.send(responseMap[code])
      } else {
        res.send(responseMap[200] || Object.values(responseMap)[0])
      }
    })
  })
  r.resources && r.resources.forEach(addMockApi)
}

raml2obj.parse('examples/marathon/api.raml').then(function(ramlObj) {
  ramlObj.resources && ramlObj.resources.forEach(addMockApi)
  app.listen(3000)
  console.log('pampas api mocker started')
})