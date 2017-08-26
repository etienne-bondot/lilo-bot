'use strict';

const env = process.env.NODE_ENV || 'development';

import request from 'request';
import Chance from 'chance';
import Dashboard from './dashboard';
import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

const chance = Chance.Chance();
const dashboardEnable = env !== 'debug';
const dashboard = dashboardEnable ? new Dashboard() : null;

const userkey = process.env.USERKEY;
const rand = Math.random();
const services = {
    GET_INFO: 'serviceGetInfos',
    INC_DROP: 'serviceIncDrops'
};
const INTERVALS = {
    GET_INFO: 5000,
    INC_DROP: 10000
};

const searchUrl = 'https://search.lilo.org/searchweb.php?q=';
const apiUrl = 'https://search.lilo.org/colibri/services/action.php';

let notifCount = 0;
let drops = {
    all: 0,
    invested: 0,
    current: 0
};

function getMe() {
    const url = `${apiUrl}?action=${services.GET_INFO}&userkey=${userkey}&rand=${rand}`;

    return new Promise((resolve, reject) => {
        request.get(url, (error, response, body) => {
            if (error) reject(error);
            else if (response.statusCode !== 200) reject(response.statusMessage);
            else {
                body = JSON.parse(body);
                resolve(body.result);
            }
        });
    });
}

function getDrops() {
    const url = `${apiUrl}?action=${services.INC_DROP}&userkey=${userkey}&rand=${rand}`;

    return new Promise((resolve, reject) => {
        request.get(url, (error, response, body) => {
            if (error) reject(error);
            else if (response.statusCode !== 200) reject(response.statusMessage);
            else {
                body = JSON.parse(body);
                resolve(body.result);
            }
        });
    });
}

function search() {
    return new Promise((resolve, reject) => {
        const randomQuerySearch = chance.word();

        request.get(`${searchUrl}${randomQuerySearch}`, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode !== 200) reject(response.statusMessage);
            else resolve();
        });
    });
}

setInterval(() => {
    search().then(() => {
        if (dashboardEnable) dashboard.log([chalk.green(`A request has been sent.`)]);
        else console.log('A request has been sent.');
    }, err => {
        if (dashboardEnable) dashboard.log([chalk.red(`Something went wrong: /search: ${err}`)]);
        else console.log(err);
    });
}, INTERVALS.GET_INFO);

getMe().then(profile => {
    drops.all = profile.myalldrops;
    drops.current = profile.mynbdrops;
    drops.invested = profile.myinvested;

    if (dashboardEnable) {
        dashboard.settings([
            `Name:            ${profile.nickname}`,
            `Email:           ${profile.email}` || 'no email',
            `Invested drops:  ${drops.invested}`,
            `All drops:       ${drops.all}`,
            `Current drops:   ${drops.current}`
        ]);
    } else {
        console.log(`
            Name:            ${profile.nickname}
            Email:           ${profile.email}
            Invested drops:  ${drops.invested}
            All drops:       ${drops.all}
            Current drops:   ${drops.current}\n`
        );
    }
}, err => {
    if (dashboardEnable) dashboard.log([chalk.red(`Something went wrong: /me: ${err}`)]);
    else console.log(err);
});


setInterval(() => {
    getDrops().then(data => {
        drops.all = data.mynbdropstotal;
        drops.current = data.mynbdrops;

        if (notifCount !== data.notifcount) {
            notifCount = data.notifcount;
            if (dashboardEnable) dashboard.log([chalk.green(`You received a notification [count:${notifCount}]`)]);
        }

        if (dashboardEnable) {
            dashboard.log([`Drops: all [${drops.all}] | current [${drops.current}] | invested [${drops.invested}]`]);
            dashboard.plot(drops);
            dashboard.render();
        } else {
            console.log(`Drops: all [${drops.all}] | current [${drops.current}] | invested [${drops.invested}]`);
        }
    }, err => {
        if (dashboardEnable) dashboard.log([chalk.red(`Something went wrong: /drops: ${err}`)]);
        else console.log(err);

        getMe().then(profile => {
            drops.all = profile.myalldrops;
            drops.current = profile.mynbdrops;
            drops.invested = profile.myinvested;

            if (dashboardEnable) {
                dashboard.log([`Drops: all [${drops.all}] | current [${drops.current}] | invested [${drops.invested}]`]);
                dashboard.plot(drops);
                dashboard.render();
            } else {
                console.log(`Drops: all [${drops.all}] | current [${drops.current}] | invested [${drops.invested}]`);
            }
        }, err => {
            if (dashboardEnable) dashboard.log([chalk.red(`Something went wrong: /drops: ${err}`)]);
            else console.log(err);
        });
    });
}, INTERVALS.INC_DROP);
