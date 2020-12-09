import express, { Request, Response } from 'express'
import cors from 'cors'
import got from 'got'

const app = express()
const URL = process.env.URL || 'localhost:3000'

app.use(cors())

const cache = new Map()

const FOOTERS = {
  it: `
  <div style="position: fixed; bottom: 0; left: 0; width: 100%; background-color: blue; color: #00ff44; z-index: 9999; font-size: 12px; padding-top: 10px; padding-bottom: 10px">
    <div style="font-size: 28px; font-weigth: bold; text-decoration: underline; padding-bottom: 10px">ATTENZIONE</div>
    <p>Questo sito non è <a href="http://italia.it" target="_blank" rel="noreferrer noopener">quello ufficiale</a> ma offre la sicurezza di una connessione https come tutti i siti dovrebbero fare nel 2020.</p>
    <p>Al netto di questo footer (che è intenzionalmente un pugno nell'occhio, inoltre faccio cagare nel design, pace) dovrebbe essere identico a quello ufficiale.</p>
    <p>Serve solo per poter fingere che il dominio principale del nostro paese abbia una delle sicurezze basilari dell'internets.</p>
    </div>`,
  en: `
    <div style="position: fixed; bottom: 0; left: 0; width: 100%; background-color: blue; color: #00ff44; z-index: 9999; font-size: 12px; padding-top: 10px; padding-bottom: 10px">
    <div style="font-size: 28px; font-weigth: bold; text-decoration: underline; padding-bottom: 10px">WARNING</div>
    <p>This website is not the <a href="http://italia.it" target="_blank" rel="noreferrer noopener">official one</a> but offers the safety of an https connection just like every website should do in 2020.</p>
    <p>Aside from this footer (which sucks design-wise intentionally, and also I cannot do design, sry) it should be identical to the official one.</p>
    <p>Its only purpose it to pretend that the main domain of our country has one of the most basic security features of the internets.</p>
  </div>`,
}

function proxyItalia(req: Request, res: Response) {
  const url = `http://italia.it/${req.path}`
  const cached = cache.get(req.path)
  if (cached) return res.end(cached)
  got.get(url).then((response) => {
    const contentType = response.headers['content-type']
    if (!contentType.startsWith('text')) return res.end(response.rawBody)
    const text = response.body.replace(/italia\.it/g, URL).replace(/http:\/\//g, '//')
    cache.set(req.path, text)
    if (!contentType.startsWith('text/html')) return res.end(text)
    const footer = req.path.startsWith('/it') ? FOOTERS.it : FOOTERS.en
    const htmlWithFooter = `${text}${footer}`
    cache.set(req.path, htmlWithFooter)
    res.end(htmlWithFooter)
  })
}

app.use(proxyItalia)

app.listen(3000, () => {
  console.log('started!')
})