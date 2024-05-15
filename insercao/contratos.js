const moment = require('moment')
const conexao = require('../connection')
const buscarContratos = require('../buscas/contratos')

/* Parâmetros: 
  p.indice: numero que será usado para subtrair do dia atual e obter o dia que será feita a busca
  p.retry: numero de vezes que serão feitas novas tentativas de busca, caso a primeira falhe 
  p.diaria: usado para indicar que é uma busca diaria, então a data não precisa ser informada, pois a página retorna os dados mais recentes 
*/

async function inserirContratos(p){ // Extrai os dados da página com o método "buscarContratos" e depois insere no banco
    let data = p.indice ? moment().subtract(p.indice, 'days').format('DD/MM/YYYY') : moment().format('DD/MM/YYYY')
    if(p.diaria) {
        data = ''
        data1 = moment().format('DD/MM/YYYY')
        console.log(`\n ----- Iniciando busca por contratos do dia ${data1} -----`)
    } else {
        console.log(`\n ----- Iniciando busca por contratos do dia ${data} -----`)
    }
    let dados = await buscarContratos(data)
    const connection = conexao()                       
    if(dados.length) { // Se for retornado um array vazio, não será feita a inserção dos dados no banco
        console.log(`Inserindo contratos do dia ${dados[0]}`)
        data = moment(dados[0], 'DD/MM/YYYY').format('YYYY/MM/DD')    
        dados.forEach(d => {                
            if(d instanceof Array){      
                let nome = d[0]              
                if(nome){ 
                    for(let i = 1; i < d.length; i++){
                        let compra = d[i][1].toString().replace(/\./g, '')
                        let compra_porcentagem = d[i][2].toString().replace(',', '.')
                        let venda = d[i][3].toString().replace(/\./g, '')
                        let venda_porcentagem = d[i][4].toString().replace(',', '.')
                        let query = `INSERT INTO contratos(nome, tipo, compra, compra_porcentagem, venda,
                            venda_porcentagem, data_atualizacao) VALUES(?, ?, ?, ?, ?, ?, ?)`    
                        let values = [nome, d[i][0], compra, compra_porcentagem, venda, 
                            venda_porcentagem, data]            
                        connection.query(query, values, err => {})
                        /* Foi criada uma constraint no banco que indica que as colunas nome, tipo e data_atualizacao
                        são únicas, então dados repetidos não serão inseridos */
                    }      
                } 
            }     
        })
    } 
    else {

        console.log(`Contratos do dia ${data} não encontrados`) 
        if(p.retry){ // Tenta novamente caso não obtenha os dados e caso o parametro retry for passado
            setTimeout(() => inserirContratos({
                indice: p.indice, 
                retry: (p.retry - 1)
            }), 600000) // 10 minutos
        }
    }

    connection.end()   
}

module.exports = inserirContratos