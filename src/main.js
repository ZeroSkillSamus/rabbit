/** @format */

require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const { initLogging, logError, requestStats } = require('./logging')
const { handleEmbed } = require('./embed')

const app = express()
const logger = initLogging()

// Middleware
app.use(morgan('combined'))
app.use(requestStats)

// CORS for Vercel
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	next()
})

// Error handling
process.on('uncaughtException', (error) => {
	logError(error)
	if (process.env.NODE_ENV === 'production') {
		process.exit(1)
	}
})

// Routes
app.get('/', (req, res) => {
	res.status(200).send('Welcome to the home page!')
})

app.get('/embed', async (req, res) => {
	const { embed_url, referrer } = req.query
	if (!embed_url || !referrer) {
		return res.status(400).json({
			error: 'Missing required parameters: embed_url and referrer',
		})
	}

	const embedSources = await handleEmbed(embed_url, referrer)
	res.json(JSON.stringify(embedSources))
})

// For Vercel, we export the app instead of starting the server directly
if (process.env.NODE_ENV !== 'production') {
	const PORT = process.env.PORT || 5000
	app.listen(PORT, '0.0.0.0', () => {
		logger.info(`Server started on http://localhost:${PORT}`)
	})
}

module.exports = app
