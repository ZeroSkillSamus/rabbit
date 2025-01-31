/** @format */

const { execSync } = require('child_process')
const path = require('path')
const axios = require('axios')

class EmbedSources {
	// constructor(sources = [], tracks = [], t = 0, server = 0) {
	// 	this.sources = sources
	// 	this.tracks = tracks
	// 	this.t = t
	// 	this.server = server
	// }

	constructor(sources = [], tracks = [], t = 0, server = 0) {
		this.m3u8_links = sources
		this.subtitles = tracks
		this.t = t
		this.server = server
	}
}

class Source {
	constructor(file, sourceType) {
		this.file = file
		this.type = sourceType
	}
}

class Track {
	constructor(file, label, kind, isDefault = false) {
		this.file = file
		this.label = label
		this.kind = kind
		if (isDefault) {
			this.default = isDefault
		}
	}
}

const handleEmbed = async (embedUrl, referrer) => {
	try {
		// For Vercel deployment, we need to handle the path differently
		const rabbitPath =
			process.env.NODE_ENV === 'production'
				? path.join('/var/task', 'rabbit.js')
				: path.join(process.cwd(), 'rabbit.js')

		const output = execSync(
			`node "${rabbitPath}" --embed-url="${embedUrl}" --referrer="${referrer}"`,
			{
				encoding: 'utf8',
				timeout: 30000, // 30 second timeout
			}
		)

		let json_out = JSON.parse(output.trim())
		let m3u8_links = await fetch_qualities(json_out['sources'][0]['file'])
		//console.log(m3u8_links)
		return {
			m3u8_links,
			subtitles: json_out['tracks'],
		}
	} catch (error) {
		console.error('Error in handleEmbed:', error)
		return new EmbedSources()
	}
}

async function fetch_qualities(default_url) {
	//const test = 'RESOLUTION=1920x1080,FRAME-RATE=23.974,CODECS'
	let iframeLinks = []
	try {
		let response = await axios.get(default_url)
		let resolutions = response.data.match(/(RESOLUTION=)(.*)(\s*?)(\s*.*)/g)
		resolutions?.forEach((str) => {
			let quality = str.split('\n')[0].split('x')[1]
			let url = str.split('\n')[1]
			if (str.split('\n')[1].includes('index'))
				iframeLinks.push({
					is_m3u8: url.includes('m3u8'),
					quality,
					url,
				})
		})

		return iframeLinks
	} catch (e) {
		console.error(e)
		return iframeLinks
	}
}

module.exports = {
	EmbedSources,
	Source,
	Track,
	handleEmbed,
}
