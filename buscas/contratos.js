module.exports = async (data) => {
    let dados = ''
    try {
        const puppeteer = require('puppeteer')     
        const browser = await puppeteer.launch({timeout: 120000})
        const page = await browser.newPage()
        page.setDefaultTimeout(120000) // 2 minutos
        const url = 'https://www2.bmf.com.br/pages/portal/bmfbovespa/lumis/lum-tipo-de-participante-ptBR.asp'
        const res = await page.goto(url)

        if(res.status() == 200) {
            if(data){
                await page.evaluate(async (data) => {
                    document.getElementById('dData1').value = data // Insere a data no input de data
                    document.querySelector('.row form button').click() // Clica no botão para obter os dados da data informada
                }, data)  
                await page.waitForNavigation() // Espera a página ser carregada                            
            }
            
            dados = await page.evaluate((data) => { // Como a página foi recarregada, o estado foi perdido e é preciso executar o método novamente              
                if(!data){
                    data = document.querySelector('form p').textContent.trim() 
                    data = data.split(' ')[2]
                }
   
                const tableDataArrays = [] // Array para armazenar os arrays de dados de cada tabela
                try {
                    const tables = document.querySelectorAll("table") // Seleciona todas as tabelas na página                  
                    if(tables.length)
                        tableDataArrays.push(data)
                    for (const table of tables) {
                        const tableData = [] // Array para armazenar os dados da tabela atual
                        const title = table.querySelector("caption") // Obtém o título da tabela
                        const rows = table.querySelectorAll("tr") // Seleciona todas as linhas da tabela
                        tableData.push(title.textContent.trim()) // Adiciona o título ao array de dados da tabela

                        for (const row of rows) {
                            const cells = row.querySelectorAll("td") // Seleciona todas as células da linha
                            const rowData = [] // Array para armazenar os dados da linha atual
                            for (const cell of cells) {
                                rowData.push(cell.textContent.trim()); // Adiciona o conteúdo da célula ao array de dados da linha
                            }

                            if(rowData.length) tableData.push(rowData) // Adiciona o array de dados da linha ao array de dados da tabela
                        }

                        tableDataArrays.push(tableData) // Adiciona o array de dados da tabela ao array principal
                    }
                } catch(err){
                    console.log(err)
                }

                return tableDataArrays
            }, data)

        } else {
            console.log('Erro ao relizar a requisição: ' + res.status())
        }       
            
        await browser.close()
    } catch(err) {
        console.log(err)
    } 
    
    return dados
}