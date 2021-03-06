'use strict';

import * as fs from "fs";
import * as path from 'path';
import * as request from 'request';
import * as dotenv from "dotenv"
dotenv.config();

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
interface ICreateNaf {
    code: String;
    description: String | null;
    label: String;
};

interface ICreateRome {
    code: String;
    description: String | null;
    label: String;
}

interface ICreatekeyword {
    label: String;
}

interface ICreateRomeNaf {
    nafId:	String;
    romeId:	String;
}

interface ICreateKeywordNaf {
    keywordId: String;
    nafId: String;
}

class App {
    public async post_content(body: ICreateNaf|ICreateRome|ICreatekeyword|ICreateRomeNaf|ICreateKeywordNaf, path: string): Promise<String> {
        return new Promise((resolve: (uuid: string) => void, reject: (err: Error) => void) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: process.env.API_URL,
            port: 443,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            }
        }
        const id_transaction = Math.random();
        request.post(options.hostname+options.path, {json:body},(error, response, body) => {
            if(error){
                console.log(id_transaction, path);
                console.log(id_transaction, body);
                console.log(error);
                reject(error);
                return;
            }
            // console.log(id_transaction, `statusCode: ${response.statusCode}`)
            // console.log(id_transaction, path);
            // console.log(id_transaction, body);
            resolve(body.uuid);
        })

       /* const req = https.request(options, res => {
        res.on('data', d => {
            console.log(id_transaction, `statusCode: ${res.statusCode}`)
            console.log(id_transaction, path);
            console.log(id_transaction, body);
            resolve(d.uuid);
        })
        })

        req.on('error', error => {
            console.log(id_transaction, path);
            console.log(id_transaction, body);
            console.error(id_transaction, error)
            reject(error);
        })

        req.write(data)
        req.end()*/
        });
    }

    public async import_script(){
        const data =fs.readFileSync(path.join(__dirname, 'naf.json'), 'utf8');

        let jsonContent = JSON.parse(data);
        console.log(jsonContent[0]);

        for (const nafArray of jsonContent) {

            let naf: ICreateNaf = {
                code: nafArray.NAF,
                description: null,
                label: nafArray.LABEL_NAF
            }

            //INSERT NAF
            let naf_id = await this.post_content(naf, '/naf');

            if(typeof naf_id !== 'string'){
                continue;
            }

            for (const romeArray of nafArray.ROMES) {

                let rome: ICreateRome = {
                    code: romeArray.CODE_ROME,
                    description: null,
                    label: romeArray.LABEL_ROME
                }

                let rome_id = await this.post_content(rome, '/rome');

                let rome_naf: ICreateRomeNaf = {
                    nafId: naf_id,
                    romeId: rome_id
                }

                await this.post_content(rome_naf, '/rome_nafs');
            };

            for (const keywordItem of nafArray.KEYWORD) {
                let keyword: ICreatekeyword = {
                    label: keywordItem
                }

                let keyword_id = await this.post_content(keyword, '/keyword');

                let keyword_naf: ICreateKeywordNaf = {
                    keywordId: keyword_id,
                    nafId: naf_id
                }

                await this.post_content(keyword_naf, '/keyword_nafs');
            };
        };
    }

}

const app = new App();
(async () => {
    try {
        await app.import_script();
    } catch (e) {
        // Deal with the fact the chain failed
        console.error(e);
        console.error("I failed miserably");
    }
})();
