const fs = require('fs');
const {format} = require('util');
const path = require('path')
const utils = require('util')
const puppeteer = require('puppeteer')
const hb = require('handlebars')
const express = require('express')
const bodyParser = require('body-parser')
const readFile = utils.promisify(fs.readFile)
const app = express()

app.use(bodyParser.json());

app.post('/downloadReport', async (req, res) =>{
    const {body} = req;
    for(let i = 0; i < body.length; i++){
        writeFile(body[i])
    }
    res.json({done: "ok"})
});

app.listen(process.env.PORT || 4444, () => {
        console.log("app started at ", process.env.PORT || 4500)
})

async function getTemplateHtml(pathToHtml) {
    try{
        const reportPath = path.resolve(pathToHtml)
        return await readFile(reportPath, 'utf8')
    }catch(error){
        return Promise.reject("Couldn't not load html template")
    }
}

async function writeFile(data)  {
    console.log(data);
    const {NAME: name, isMiya} = data;
    const path = isMiya?.toLowerCase() === "true" ? "./html/invitation_miya.html" : "./html/invitation_menasi.html"
    data.NAME = `${data.title} ${name}`
    data.RSVP = data.RSVP ?? ""
    const ret = await generatePdf(data, path)
    let newFileName = `${isMiya?.toLowerCase() === "true" ? "miya_": "dumbo_"}${name}_${Date.now()}.pdf`;

    fs.writeFile(newFileName, ret,{ flag: 'wx' }, (err) => {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!", name);
    })
    
}


async function generatePdf(data, path) {

    const res = await getTemplateHtml(path)

    const template = hb.compile(res, { strict: true })
    const result = template(data)
    const html = result;
    const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ]
      });
    const page = await browser.newPage()
    await page.setContent(html);
    const Buffer = await page.pdf({  format: 'A4' })
    await browser.close();
    return Buffer;  
}