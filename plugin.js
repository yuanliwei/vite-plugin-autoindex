import { readdir, stat } from 'fs/promises'

/**
 * @returns {import('vite').Plugin}
 */
export default function autoindex() {
    return {
        name: 'vite-plugin-autoindex',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                let filepath = server.config.root + req.url
                if (filepath.endsWith('/')) {
                    let s = await stat(filepath)
                    if (s.isDirectory()) {
                        res.setHeader('content-type', 'text/html')
                        res.setHeader('last-modified', (new Date(s.mtime)).toUTCString())
                        res.writeHead(200, { 'Content-Type': 'text/html' })
                        let html = await buildIndex(filepath, req.url)
                        return res.end(html)
                    }
                }
                next()
            })
        }
    }
}

/**
 * @param {string} dir
 * @param {string} url
 * @returns {Promise<string>}
 */
async function buildIndex(dir, url) {
    let title = url
    let files = await readdir(dir)
    let arr = []
    let fileItems = []
    let dirItems = []
    files.sort((l, h) => l.localeCompare(h))
    for (const file of files) {
        let filepath = dir + file
        let s = await stat(filepath)
        let time = s.mtime.toLocaleString()
        if (s.isDirectory()) {
            dirItems.push(`<tr> <td><code>${time}</code></td> <td></td> <td><a href="${url}${file}/">${file}/</a></td> </tr>`)
        } else {
            let size = formatSize(s.size)
            fileItems.push(`<tr> <td><code>${time}</code></td> <td><code>${size}</code></td> <td><a href="${url}${file}">${file}</a></td> </tr>`)
        }
    }
    let parent = url.replace(/[^/]+\/$/, '')
    arr.push(`<tr> <td></td> <td></td> <td><a href="${parent}">../</a></td> </tr>`, ...dirItems, ...fileItems)
    let crumbs = []
    let lastIndex = 0
    let index = 0
    while (index > -1) {
        let name = url.substring(lastIndex, index + 1)
        let pathname = url.substring(0, index + 1)
        crumbs.push(`<a href="${pathname}">${name}</a>`)
        lastIndex = index + 1
        index = url.indexOf('/', lastIndex)
    }
    const templ = `
    <!DOCTYPE html>
    <html>

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <title>Index of ${title}</title>
        <style>
            tr {
                white-space: nowrap;
            }

            a {
                text-decoration: rgb(255, 204, 204) dotted underline;;
            }

            td:nth-child(2) {
                text-align: right;
                padding-left: 1em;
            }

            td:nth-child(3) {
                padding-left: 1em;
            }
        </style>
    </head>

    <body>
        <h1>Index of ${crumbs.join('')}</h1>
        <hr>
        <table>
            ${arr.join('\n')}
        </table>
        <hr>
    </body>

    </html>
`
    return templ.trim()
}

/**
 * @param {number} size
 */
function formatSize(size) {
    let companys = 'B KB MB GB TB'.split(' ')
    let cur = size
    while (cur >= 1024) {
        companys.shift()
        cur /= 1024
    }
    return Math.round(cur * 10) / 10 + companys[0]
}