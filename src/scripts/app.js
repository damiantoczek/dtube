// Static Variables
const DAYS_IN_MONTH = (()=>{ let now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 0).getDate() })()
const DTC_MULTIPLIER = 100

// Elements
const menuButton = document.getElementById('menuButton')
const navPanel = document.getElementById('navPanel')
const hashtags = document.getElementById('hashtags')
const links = document.getElementById('links')
const main = document.getElementById('main')

// Functions
function clear(node){
    while(node.lastChild) node.removeChild(node.lastChild) 
}

function evalTime(ts){
    const dateNow = new Date

    const diference = dateNow.getTime() - ts

    const seconds = diference / 1000
    const minutes = seconds / 60
    const hours = minutes / 60
    const days = hours / 24
    const weeks = days / 7
    
    if(seconds < 60){
        return parseInt(seconds) + 's ago'
    }else if(minutes < 60){
        return parseInt(minutes) + 'min ago'
    }else if(hours < 24){
        return parseInt(hours) + 'h ago'
    }else if(days < 7){
        return parseInt(days) + 'days ago'
    }else if(weeks < DAYS_IN_MONTH / 7){
        return parseInt(weeks) + `${weeks === 1 ? 'week' : 'weeks'} ago`
    }
}

function evalVotingPower(votes){

    const vp = votes.map(vote => vote.vt).reduce(
        (acc, value) => acc + value
    )

    // Quadrillion
    if(vp > 999999999999999) return 'WTF?';

    // Trillion
    if(vp > 999999999999) return parseInt(vp / 1000000000000) = 'T';

    // Billion
    if(vp > 999999999) return parseInt(vp / 1000000000) + 'B';

    // Million
    if(vp > 999999) return parseInt(vp / 1000000) + 'M'
    
    // Thousand
    if(vp > 999) return parseInt(vp / 1000) + 'K'

    return vp
}

function evalDuration(value){
    const seconds = parseInt(value)
    if(!isNaN(seconds)){
        const duration = new Date(parseInt(seconds) * 1000).toISOString().substr(11, 8)
        // Removes the "00:" for hours 
        return duration.substr(0, 3) === '00:' ? duration.substr(3) : duration
    }

    return '🙈'
}

function evalDTC(dist){
    return String(parseInt(dist / DTC_MULTIPLIER))
}

function getThumbnailSrc(files){
    if(files.ipfs?.img){
        return `https://snap1.d.tube/ipfs/${files.ipfs.img[360]}`
    }else if(files.youtube){
        return `https://i.ytimg.com/vi/${files.youtube}/mqdefault.jpg`
    }
    return 
}

// Menu
const menu = {
    isOpen: false,
    open: function(){
        this.isOpen = true
        navPanel.classList.add('open')
        navPanel.classList.remove('closed')

        hashtags.classList.remove('hide')
        links.classList.remove('hide')
    },
    close: function(){
        this.isOpen = false
        navPanel.classList.add('closed')
        navPanel.classList.remove('open')
        
        hashtags.classList.add('hide')
        links.classList.add('hide')
    }
}

menuButton.onclick = e => menu.isOpen? menu.close() : menu.open();
main.onclick = e => {if(menu.isOpen) menu.close()}

// vNode
function n(tag, args, content){
    const el = document.createElement(tag)

    if(args){
        // Handle arguments
        for(key in args){
            el[key] = args[key]
        }
    }

    if(content){
        if(typeof content === 'string' || typeof content === 'number'){
            el.textContent = content
        }else if(content instanceof Array){
            el.append(...content)
        }else{
            el.appendChild(content)
        }
    }

    return el
}

// vNode template Functions
function mkVideoNode(data){

    return n('div', {className: 'video'}, [
        n('div', {className: 'preview', id: data._id, onclick: function(){window.location.hash = '#!/v/' + this.id}}, [
            n('img', {className: 'thumbnail', src: getThumbnailSrc(data.json.files)}),
            n('div', {className: 'votingpower'}, [
                n('i', {className: 'icon bolt yellow'}),
                evalVotingPower(data.votes)
            ]),
            n('div', {className: 'duration'}, evalDuration(data.json.dur))
        ]),
        n('div', {className: 'info'}, [
            n('div', {className: 'title'}, data.json.title),
            n('div', {className: 'username'}, data.author),
            n('div', {className: 'stats'}, [
                n('div', {className: 'dtc'}, evalDTC(data.dist)),
                n('div', {className: 'time'}, evalTime(data.ts))
            ])
        ])
    ])
}
function mkSectionNode(data, name, href){
    data.length = 8
    return n('section', null, [
        n('div', {className: 'panel'}, [
            n('h2', null, name),
            n('div', {className: 'controlls'}, [
                n('button', {className: 'previous'},
                    n('i', {className: 'icon chevronL'})
                ),
                n('button', {className: 'next'},
                    n('i', {className: 'icon chevronR'})
                )
            ]),
            n('a', {href}, 'Show All')
        ]),
        n('div', {className: 'container'},
            n('div', {className: 'videos'}, data.map(obj => {
                return mkVideoNode(obj)
            }))
        )
    ])
}

// Router
class Router{
    constructor(routes){
        this._raw = routes
        this.routes = {}
        // this.views = {}

        // Normalize routes so they can be used.
        for(let route in routes){
            const hasParams = route.indexOf(':') !== -1;
            if(hasParams){
                const params = route.split(':')
                routes[route].params = params.splice(1)
                this.routes[params[0]] = routes[route]
            }else{
                this.routes[route] = routes[route]
            }
        }

        // Hash event listener
        const loadNewHash = async () => {
            const hash = window.location.hash.substr(2)

            if(!hash || hash === '/'){
                window.location.hash = '#!/home'
            }else{
                const [route, ...values] = hash.split('/').splice(1)
                const {init, params, view, root} = this.routes['/' + route]

                if(!'/' + this.routes[route]){
                    window.location.hash = '#!/home'
                }

                // Combine params and values
                const paramData = {}
                if(params){
                    for(let i = 0; i < params.length; i++){
                        const key = params[i]
                        const value = values[i]
                        paramData[key] = value
                    }
                }
                
                // Load view
                const data = await init(paramData)
                const nodes = view(data)
    
                if(nodes instanceof Array){
                    root.append(...nodes)
                }else{
                    root.appendChild(nodes)
                }
            }
        }

        window.onhashchange = loadNewHash

        loadNewHash()
    }

}

// Videos
const videos = {
    cache: {},
    addMany: function(array){
        for(let i = 0, len = array.length; i < len; i++){
            const video = array[i]
            const id = video._id

            if(!this.cache[id]){
                this.cache[id] = video
            }
        }
    },
    add: function(video){
        if(!this.cache[video._id]){
            this.cache[video._id] = video
        }
    },
    get: async function(id){
        return new Promise(async (resolve, reject) => {
            if(this.cache[id]){
                resolve(this.cache[id])
            }

            const res = await fetch('https://avalon.d.tube/content/bmmedits02/Qmd69nHVd8bjXYRFQCwHcSTYmuAxi1kS6uJ1EcqJzdkTft')
            const meta = await res.json()

            if(!this.cache[meta._id]){
                this.cache[meta._id] = meta
            }

            resolve(meta)
        })
        
    },
    getPlayerUrl: async function(id){
        // make copy
        const meta = await this.get(id)

        const video = Object.assign({}, meta.json)

        delete video.desc
        delete video.hide
        delete video.refs
        delete video.tag
        delete video.title
        delete video.files?.ipfs?.gw

        video.thumbnailUrl = video.files?.youtube ? 
            `https:!!i.ytimg.com!vi!${video.files.youtube}!mqdefault.jpg` : `https:!!snap1.d.tube!ipfs!${video.files.ipfs.img[118]}`

        // Syntax
        // (
        //     'files': (
        //         'youtube': 'AQf-ZHcfseI'
        //     ),
        //     'dur': '3945',
        //     'nsfw': 0,
        //     'oc': 1,
        //     'thumbnailUrl': 'https:!!i.ytimg.com!vi!AQf-ZHcfseI!mqdefault.jpg'
        // )
        
        let json = JSON.stringify(video)
        json = json.replaceAll('{', '(')
        json = json.replaceAll('}', ')')
        json = json.replaceAll('"', "'")

        return `https://emb.d.tube/#!//${json}`
    }
}


// VIEWS
const HOME = {
    root: main,
    view: function(data){
        clear(main)
        main.className = 'videos'

        return data.map(({name, videos, url}) => mkSectionNode(videos, name, url))
    },
    init: async function(){
        const requests = [
            'https://avalon.d.tube/hot',
            'https://avalon.d.tube/new',
            'https://avalon.d.tube/feed/botdamian00',
            'https://avalon.d.tube/trending'
        ]

        const res = await Promise.all(requests.map(url=>fetch(url)))
        const json = await Promise.all(res.map(async(data)=>await data.json()))

        // Cache the video meta data
        json.forEach(arr => videos.addMany(arr))

        return [
            {name: 'Feed Videos', videos: json[2], url: '/feed'},
            {name: 'Hot Videos', videos: json[0], url: '/hot'},
            {name: 'Trending Videos', videos: json[3], url: '/trending'},
            {name: 'New Videos', videos: json[1], url: '/new'}
        ]
    }
}

const VIDEO = {
    root: main,
    view: function({meta, src}){
        clear(main)
        main.className = 'video'

        const videoAttributes = {
            src,
            frameborder: 0,
            allow: 'autoplay'
        }

        return [
            n('div', {className: 'player'},
                n('iframe', videoAttributes)
            ),
            n('h1', {className: 'title'}, meta.json.title),
            n('div', {className: 'panel'}, [
                n('span', {className: 'username'}, meta.author),
                n('div', {className: 'keywords'}, Object.keys(meta.tags).map(tag => {
                    return n('a', null, tag)
                })),

            ]),
            n('div', {clasName: 'description'})
        ]
    },
    init: async function(params){
        const id = params.username + '/' + params.hash

        return {
            src: await videos.getPlayerUrl(id),
            meta: await videos.get(id)
        }
    }
}

const UPLOAD = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'Upload')
    },
    init: function(){
        return null
    }
}

const MYCHANNEL = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'My Channel')
    },
    init: function(){
        return null
    }
}

const FEED = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'My Feed')
    },
    init: function(){
        return null
    }
}

const HOT = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'Hot Videos')
    },
    init: function(){
        return null
    }
}

const NEW = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'New Videos')
    },
    init: function(){
        return null
    }
}

const TRENDING = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'Trending Videos')
    },
    init: function(){
        return null
    }
}

const WATCHLIST = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'Watchlist')
    },
    init: function(){
        return null
    }
}

const WATCHHISTORY = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'Watch History')
    },
    init: function(){
        return null
    }
}

const LEADERS = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'Leaders')
    },
    init: function(){
        return null
    }
}

const SETTINGS = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'Settings')
    },
    init: function(){
        return null
    }
}

const HELP = {
    root: main,
    view: function(){
        clear(main)
        return n('h1', null, 'Help')
    },
    init: function(){
        return null
    }
}

// Init router
const router = new Router({
    '/home': HOME,
    '/upload': UPLOAD,
    '/v:username:hash': VIDEO,
    '/c': MYCHANNEL,
    '/feed': FEED,
    '/hot': HOT,
    '/new': NEW,
    '/trending': TRENDING,
    '/watchlist': WATCHLIST,
    '/watchhistory': WATCHHISTORY,
    '/leaders': LEADERS,
    '/settings': SETTINGS,
    '/help': HELP
})



