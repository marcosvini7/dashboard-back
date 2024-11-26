const cors = require('cors');

// Permite requisições de todas as origens
const corsOptions = {
  origin: '*'
};

module.exports = cors(corsOptions);