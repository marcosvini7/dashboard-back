const express = require('express')
const moment = require('moment')
const cors = require('cors')
const schedule = require('node-schedule')
const conexao = require('./connection')
const buscarContratos = require('./buscas/contratos')
const buscarPI = require('./buscas/participacao_investidores')
const app = express()
const port = 3000
const executarBuscaDiaria = true 
const qtdContratos = 5 // Quantidades de dias anteriores em que serão feitas as buscas, começam a partir da data atual
const qtdPI = 5 // Colocar 0, caso não queira realizar buscas

/* Parâmetros: 
p.indice: numero que será usado para subtrair do dia atual e obter o dia que será feita a busca
p.retry: numero de vezes que serão feitas novas tentativas de busca, caso a primeira falhe 
p.diaria: usado para indicar que é uma busca diaria, então a data não precisa ser informada, pois a página retorna os dados mais recentes 
*/
async function inserirContratos(p){ // Extrai os dados da página com o método "buscarContratos" e depois insere no banco
    let data = p.indice ? moment().subtract(p.indice, 'days').format('DD/MM/YYYY') : moment().format('DD/MM/YYYY')
    if(p.diaria) data = ''
    console.log('\n ----- Iniciando busca por contratos -----')
    let dados = await buscarContratos(data)
    const connection = conexao()                       
    if(dados.length) { // Se for retornado um array vazio, não será feita a inserção dos dados no banco
        console.log(`Inserindo contratos do dia ${data}... data obtida: ${dados[0]}`)
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
        /* A função de busca pode não retornar os dados por motivos diversos, como exemplo a B3
        pode não ter publicado os dados do dia em que está sendo feita a busca, ou o servidor da B3 
        pode estar instável no momento e obtivemos um timeoutException */
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

async function inserirPI(p){// Extrai os dados da página com o método "buscarPI" e depois insere no banco
    let data = p.indice ? moment().subtract(p.indice, 'days').format('DD-MM-YYYY') : moment().format('DD-MM-YYYY')
    console.log('\n ----- Iniciando busca por participação dos investidores -----')
    let dados = await buscarPI(data) 
    const connection = conexao()                       
    if(dados.length) { // Se for retornado um array vazio, não será feita a inserção dos dados no banco
        console.log(`Inserindo participação dos investidores do dia ${data}... data obtida: ${dados[0]}`)
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

async function buscaCompleta(){ // Executa a quantidade de vezes informada, para obter dados de vários dias de uma única vez
    if(qtdContratos > 0){
        for(let i = 0; i < qtdContratos; i++){ 
            console.time('Tempo')              
            await inserirContratos({indice: i})
            console.timeEnd('Tempo')
        }
    }
    if(qtdPI > 0){
        for(let i = 0; i < qtdPI; i++){  
            console.time('Tempo')               
            await inserirPI({indice: i})
            console.timeEnd('Tempo')
        }
    }
}

async function buscaDiaria(){ 
    // Define a regra de agendamento para todos os dias às 23:00 no fuso horário do Brasil
    const rule = new schedule.RecurrenceRule()
    rule.hour = 23
    rule.minute = 0
    rule.tz = 'America/Sao_Paulo' // Definindo o fuso horário do Brasil

    // Cria a tarefa agendada
    schedule.scheduleJob(rule, function(){
        inserirContratos({retry: 3, diaria: true}) 
        inserirPI({retry: 3}) // Caso os dados não sejam obtidos, 3 novas tentativas serão feitas
    })
}

// Configurações de cors: apenas requisições das origens definidas são permitidas
const allowedOrigins = ['http://localhost:8080']
const corsOptions = { origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(corsOptions))

// Rotas da aplicação
app.get('/contratos', async (req, res) => {
    const connection = conexao();
    
    let query = 'SELECT * FROM contratos ';
    let values = [];

    if(req.query.data || (req.query.data_inicio && req.query.data_fim) || req.query.nome){
        query += 'WHERE '
    }

    if (req.query.data) {
        query += 'data_atualizacao = ? ';
        values.push(req.query.data);
    } else if (req.query.data_inicio && req.query.data_fim) {
        query += 'data_atualizacao >= ? AND data <= ? ';
        values.push(req.query.data_inicio, req.query.data_fim);
    }

    if(req.query.nome){
        query += 'nome IN('
        if(req.query.nome.includes(',')){          
            let nomesContratos = req.query.nome.split(',')
            for(let i = 0; i < nomesContratos.length; i++){
                query += i == 0 ? '?' : ',?'
            }
            query += ') '
            values = nomesContratos
        } else {
            query += '?) '
            values.push(req.query.nome)
        }
    }
    
    query += 'ORDER BY data_atualizacao';

    connection.query(query, values, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Erro interno no servidor');
        } else {
            res.send(JSON.stringify(results));
        }
        connection.end();
    });
});

app.get('/contratos/nomes', async (req, res) => {
    const connection = conexao()
    let query = 'SELECT DISTINCT nome FROM contratos'

    connection.query(query, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Erro interno no servidor');
        } else {
            res.send(JSON.stringify(results));
        }
        connection.end();
    });
})

app.get('/participacao-investidores', async (req, res) => {
    const connection = conexao();
    
    let query = 'SELECT * FROM participacao_investidores ';
    let values = [];

    if (req.query.data) {
        query += 'WHERE data = ? ';
        values.push(req.query.data);
    } else if (req.query.data_inicio && req.query.data_fim) {
        query += 'WHERE data >= ? AND data <= ? ';
        values.push(req.query.data_inicio, req.query.data_fim);
    }
    
    query += 'ORDER BY data';

    connection.query(query, values, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Erro interno no servidor');
        } else {
            res.send(JSON.stringify(results));
        }
        connection.end();
    });
});


buscaCompleta()
if(executarBuscaDiaria) buscaDiaria()

app.listen(port, () => {
    console.log(`Servidor escutando na porta ${port}`);
});




