const cors = require('cors')

// Apenas requisições das origens definidas são permitidas
const allowedOrigins = [process.env.FRONT_ORIGIN || 'http://localhost:8080']
const corsOptions = { origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

module.exports = cors(corsOptions)