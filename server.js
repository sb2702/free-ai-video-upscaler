const express = require('express')
const app = express()
const port = 8000

app.use(express.static('src'))

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})