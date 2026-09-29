// Entry point (cPanel "Application startup file": app.js)
require('./server/index.js').start().catch(err => {
  console.error('Failed to start:', err.message)
  process.exit(1)
})
