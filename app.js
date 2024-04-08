const express = require('express')
const schedule = require('node-schedule')
require('dotenv').config()
const router = require('./routes')
const cors = require('./cors')
const inserirContratos = require('./insercao/contratos')
const inserirPI = require('./insercao/participacao_investidores')
const app = express()
const port = process.env.APP_PORT || 3000
const qtdContratos = process.env.QTD_CONTRATOS || 0
const qtdPI = process.env.QTD_PI || 0
const buscaDiariaContratos = process.env.BUSCA_DIARIA_CONTRATOS || false
const buscaDiariaPI = process.env.BUSCA_DIARIA_PI || false

app.use(cors)
app.use(router)

// Executa a quantidade de vezes informada, para obter dados de vários dias de uma única vez
async function inserirDados() {
    for(let i = 0; i < qtdContratos; i++){ 
        console.time('Tempo')              
        await inserirContratos({indice: i})
        console.timeEnd('Tempo')
    }

    for(let i = 0; i < qtdPI; i++){  
        console.time('Tempo')               
        await inserirPI({indice: i})
        console.timeEnd('Tempo')
    }
}

if(buscaDiariaContratos || buscaDiariaPI){
    // Define a regra de agendamento para todos os dias às 23:00 no fuso horário do Brasil
    const rule = new schedule.RecurrenceRule()
    rule.hour = 23
    rule.minute = 0
    rule.tz = 'America/Sao_Paulo' // Definindo o fuso horário do Brasil

    // Cria a tarefa agendada
    schedule.scheduleJob(rule, async function(){
        if(buscaDiariaContratos) await inserirContratos({retry: 3, diaria: true}) 
        if(buscaDiariaPI) await inserirPI({retry: 3}) 
        // Caso os dados não sejam obtidos, 3 novas tentativas serão feitas
    })
}

inserirDados()

app.listen(port, () => {
    console.log(`Servidor escutando na porta ${port}`)
})




