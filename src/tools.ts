import fs from 'fs';
import { resolve } from 'dns';
class Tools {


    static getArgs(message:string) {
        const args = message.split(" ");
        return args;
    }

    static async resolveFile(filename: string) {
        fs.readFile(`./src/collections/${filename}.json`, 'utf-8', (err, data) => {
            return JSON.parse(data);
        });
    }
}


export default Tools;