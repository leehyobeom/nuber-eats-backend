import { Inject, Injectable } from "@nestjs/common";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { EmailVars, MailModuleOptions } from "./mail.interfaces";
import got from 'got';
import * as FormData from "form-data";

@Injectable()
export class MailService {
    constructor(
        @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions
    ){

    }

    private async sendEmail(subject:string, template:string, emailVars: EmailVars[]){
        const form = new FormData();
        form.append("from",`Excited User <mailgun@${this.options.domain}>`)
        form.append("to",`Excited User <dlgyqja104@naver.com>`)
        form.append("subject", subject)
        form.append("template", template)
        form.append("v:userName", "효범쓰!")
        emailVars.forEach( emailVar =>{
            form.append(`v:${emailVar.key}`, emailVar.value)
        });
        try {
            await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`,{
                 method: 'POST',
                 headers:{
                     "Authorization": `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString("base64")}`
                 },
                 body: form
             })                   
        } catch (error) {
            
        }
    }

    sendVerificationEmail(userName:string, code:string){
        this.sendEmail("Verufy Your Email","nubereats", 
        [{key:"userName", value: userName},
         {key:"code", value: code}  
    ]);
    }
}