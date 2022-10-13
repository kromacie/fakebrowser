// noinspection HttpUrlsUsage

'use strict';

const {PuppeteerExtraPlugin} = require('puppeteer-extra-plugin');

const withUtils = require('../_utils/withUtils');
const url = require("url");

class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
        super(opts);
    }

    get name() {
        return 'evasions/workers.scope';
    }

    // noinspection JSUnusedGlobalSymbols
    get requirements() {
        return new Set([]);
    }

    async onPageCreated(page) {
        await withUtils(this, page).evaluateOnNewDocument(this.mainFunction, {
            internalHttpServerPort: this.opts.internalHttpServerPort,
            browserUUID: this.opts.browserUUID,
        });
    }

    mainFunction = (utils, {internalHttpServerPort, browserUUID}) => {
        console.log(this)
        console.log(typeof this)
    };
}

module.exports = function (pluginConfig) {
    return new Plugin(pluginConfig);
};
