import { httpServerHandler } from 'cloudflare:node'
import app from './app/server.js'

app.listen(3000)

export default httpServerHandler({ port: 3000 })
