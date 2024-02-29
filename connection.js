const mysql2 = require('mysql2')

module.exports = () => {
  return mysql2.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dashboard'
  })
}