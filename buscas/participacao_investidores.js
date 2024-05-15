module.exports = async (data) => {
    let dados = ''
    try {
        const puppeteer = require('puppeteer')     
        const browser = await puppeteer.launch({timeout: 120000})
        const page = await browser.newPage()
        page.setDefaultTimeout(120000) // 2 minutos
        const url = `https://arquivos.b3.com.br/bdi/tabelas/${data}?classification=aeaccfe3-e492-40c4-9359-f9d6d2ef3ed9&table=SharesInvesVolum&lang=pt-BR`
        const res = await page.goto(url)
        
        if(res.status() === 200){                        
            dados = await page.evaluate(async () => {   
                let tentativas = 0
                while(document.getElementsByClassName('tdHeader').length == 0
                    || document.querySelector('.table') == null
                ){
                    if(tentativas >= 180) break
                    await new Promise(r => setTimeout(r, 1000))
                    tentativas++
                }            
                if(tentativas == 180) return ''
                // Tempo de espera para que os elementos necessários da página sejam carregados

                let tableData = []
                try {
                    let dia = document.getElementsByClassName('tdHeader')[1].textContent.trim()
                    dia = dia.split(' ')[9] // Obtém a data correta
                    // As vezes, a B3 entrega os dados de uma data diferente da solicitada
                    // Então, a data correta é a que está em um texto da própria página
                    let table = document.querySelector('.table')                                 
                    const tbody = table.querySelector('tbody')
                    const rows = tbody.querySelectorAll("tr")
                    if(rows.length > 1){
                        tableData.push(dia)
                        for (const row of rows) {
                            const cells = row.querySelectorAll("td") 
                            const rowData = [] 
                            for (const cell of cells) {
                                rowData.push(cell.textContent.trim())
                            }
                            
                            if(rowData.length) tableData.push(rowData)
                        }
                    }
                    
                } catch(err){
                    console.log(err)
                }

                return tableData 
            })
                   
        } else {
            console.log('Erro ao relizar a requisição: ' + res.status())
        }

        await browser.close()
    } catch(err) {
        console.log(err)
    } 

    return dados
}