import express, { Request, Response } from 'express'
import { JSDOM } from 'jsdom'
import cors from 'cors'
import got from 'got'
import dns from 'dns'

const app = express()
const URL = process.env.URL || 'localhost:3000'

app.use(cors())

const cache = new Map()

const ITALIA_IT_IP = '5.175.52.19'

const overrideItaliaBackup = (
  hostname: string,
  family: number,
  cb: (err: Error, address: string, family: number) => void,
) => {
  if (hostname === 'italia.it') return cb(null, ITALIA_IT_IP, 4)
  return dns.lookup(hostname, family, cb)
}

const FOOTERS = {
  it: `
  <div style="position: fixed; bottom: 0; left: 0; width: 100%; background-color: #00f; color: #ff6600; z-index: 9999; font-size: 12px; padding-top: 10px; padding-bottom: 10px">
    <div style="font-size: 28px; font-weigth: bold; text-decoration: underline; padding-bottom: 10px">ATTENZIONE</div>
    <p>Questo sito non è <a href="http://italia.it" style="color: #ffff00" target="_blank" rel="noreferrer noopener">quello ufficiale</a> ma offre la sicurezza di una connessione https come <a href="https://www.france.fr" style="color: #ffff00" target="_blank" rel="noreferrer noopener">tutti</a> i <a href="https://deutschland.de" style="color: #ffff00" target="_blank" rel="noreferrer noopener">siti</a> dovrebbero fare nel 2020.</p>
    <p>Al netto di questo footer (che è intenzionalmente un pugno nell'occhio, inoltre faccio cagare nel design, pace) dovrebbe essere identico a quello ufficiale.</p>
    <p>Serve solo per poter fingere che il dominio principale del nostro paese abbia una delle sicurezze basilari dell'internets.</p>
    <p>Leggi di più sul <a href="https://github.com/lucamattiazzi/itaila.it" style="color: #ffff00">repo Github</a></p>
  </div>`,
  en: `
  <div style="position: fixed; bottom: 0; left: 0; width: 100%; background-color: #00f; color: #ff6600; z-index: 9999; font-size: 12px; padding-top: 10px; padding-bottom: 10px">
    <div style="font-size: 28px; font-weigth: bold; text-decoration: underline; padding-bottom: 10px">WARNING</div>
    <p>This website is not the <a href="http://italia.it" style="color: #ffff00" target="_blank" rel="noreferrer noopener">official one</a> but offers the safety of an https connection just like <a href="https://www.france.fr" style="color: #ffff00" target="_blank" rel="noreferrer noopener">every</a> <a href="https://deutschland.de" style="color: #ffff00" target="_blank" rel="noreferrer noopener">website</a> should do in 2020.</p>
    <p>Aside from this footer (which sucks design-wise, intentionally but also I cannot do design, sry) it should be identical to the official one.</p>
    <p>Its only purpose it to pretend that the main domain of our country has one of the most basic security features of the internets.</p>
    <p>Read more on the <a href="https://github.com/lucamattiazzi/itaila.it" style="color: #ffff00">Github repo</a></p>
  </div>`,
  github: `
  <a href="https://github.com/lucamattiazzi/itaila.it" style="position: absolute; top: 0; left: 0; z-index:9999">
    <img loading="lazy" width="149" height="149" src="https://github.blog/wp-content/uploads/2008/12/forkme_left_orange_ff7600.png?resize=149%2C149" alt="Fork me on GitHub" data-recalc-dims="1">
  </a>
  `,
} as const

const METADATA = {
  DESCRIPTION: {
    it:
      "Sito NON ufficiale (una copia appena più sicura dell'ufficiale) del turismo in Italia: vacanze, arte e cultura, storia, gastronomia, artigianato, eventi, natura, laghi,montagna, golf, sci, nautica, terme, sport e avventura",
    en:
      'Italian tourism UNofficial (a copy, slightly safer than the official one) website: vacations, art and culture, history, events, nature, lakes, mountains, golf, sci, boating, thermal spas, sports and adventure',
  },
  TITLE: {
    it: "Sito NON ufficiale (una copia appena più sicura dell'ufficiale) del turismo in Italia",
    en: 'Italian Tourism UNOfficial (a copy, slightly safer than the official one) Website',
  },
} as const

function proxyItalia(req: Request, res: Response) {
  const url = `http://italia.it/${req.path}`
  const cached = cache.get(req.path)
  if (cached) return res.end(cached)
  got
    .get(url, { lookup: overrideItaliaBackup as any })
    .then((response) => {
      const contentType = response.headers['content-type']
      res.setHeader('content-type', contentType)
      if (!contentType.startsWith('text')) return res.end(response.rawBody)
      const text = response.body.replace(/italia\.it/g, URL).replace(/http:\/\//g, '//')
      cache.set(req.path, text)
      if (!contentType.startsWith('text/html')) return res.end(text)
      const lang = req.path.startsWith('/it') ? 'it' : 'en'
      const footer = FOOTERS[lang]
      const title = METADATA.TITLE[lang]
      const description = METADATA.DESCRIPTION[lang]
      const dom = new JSDOM(text)
      try {
        dom.window.document.getElementsByTagName('title')[0].text = title
        dom.window.document.head
          .querySelector('meta[name="DESCRIPTION"]')
          .setAttribute('content', description)
      } catch (err) {
        console.error('err', err)
      }
      const serialized = dom.serialize()

      const htmlWithFooter = `${serialized}${footer}${FOOTERS.github}`
      cache.set(req.path, htmlWithFooter)
      res.end(htmlWithFooter)
    })
    .catch((err) => {
      console.error(err)
      res.sendStatus(400)
    })
}

app.use(proxyItalia)

app.listen(3000, () => {
  console.log('started!')
})
