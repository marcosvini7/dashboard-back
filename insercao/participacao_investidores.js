const moment = require('moment')
const conexao = require('../connection')
const buscarPI = require('../buscas/participacao_investidores')

/* Parâmetros: 
  p.indice: numero que será usado para subtrair do dia atual e obter o dia que será feita a busca
  p.retry: numero de vezes que serão feitas novas tentativas de busca, caso a primeira falhe 
*/

async function inserirPI(p){// Extrai os dados da página com o método "buscarPI" e depois insere no banco
    if(!p.indice){
        data = moment().add(1, 'days').format('DD-MM-YYYY')
    } else {
        data = moment().subtract(p.indice - 1, 'days').format('DD-MM-YYYY')
    }
    console.log(`\n ----- Iniciando busca por participação dos investidores do dia ${data} -----`)
    let dados = await buscarPI(data) 
    const connection = conexao()                       
    if(dados.length) { // Se for retornado um array vazio, não será feita a inserção dos dados no banco
        console.log(`Inserindo participação dos investidores do dia ${dados[0]}`)
        data = moment(dados[0], 'DD/MM/YYYY').format('YYYY-MM-DD')
        for(let i = 1; i < dados.length; i++){
            let compras = dados[i][1].toString().replace(/\./g, '')
            let participacao_compras = dados[i][2].toString().replace(',', '.')
            let vendas = dados[i][3].toString().replace(/\./g, '')
            let participacao_vendas = dados[i][4].toString().replace(',', '.')
            let query = `INSERT INTO participacao_investidores(tipo_investidor, compras, participacao_compras,
                vendas, participacao_vendas, data) VALUES(?, ?, ?, ?, ?, ?)`    
            let values = [dados[i][0], compras, participacao_compras, vendas, participacao_vendas, data]          
            connection.query(query, values, err => {})
            /* Foi criada uma constraint no banco que indica que as colunas tipo_investidor e data
            são únicas, então dados repetidos não serão inseridos */   
        }           
    } 
    else 
        console.log(`Participaçao dos investidores do dia ${data} não encontrados`) 
        if(p.retry){ // Tenta novamente caso não obtenha os dados e caso o parametro retry for passado
            setTimeout(() => inserirPI({
                indice: p.indice, 
                retry: (p.retry - 1)
            }), 600000) // 10 minutos
        }

    connection.end() 
}

module.exports = inserirPI