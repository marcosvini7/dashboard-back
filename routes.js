const express = require('express')
const router = express.Router()
const conexao = require('./connection')

router.get('/api/contratos', async (req, res) => {
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

router.get('/api/contratos/nomes', async (req, res) => {
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

router.get('/api/participacao-investidores', async (req, res) => {
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

module.exports = router