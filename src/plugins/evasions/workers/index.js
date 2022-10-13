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
        return 'evasions/workers';
    }

    async onPageCreated(page) {
        await withUtils(this, page).evaluateOnNewDocument(this.mainFunction, {
            internalHttpServerPort: this.opts.internalHttpServerPort,
            browserUUID: this.opts.browserUUID,
        });
    }

    mainFunction = (utils, {internalHttpServerPort, browserUUID}) => {
        if ('undefined' !== typeof Worker) {
            // noinspection UnnecessaryLocalVariableJS
            const _Worker = Worker;
            const workerConstructor = Object.getOwnPropertyDescriptor(
                _Worker.prototype, 'constructor',
            );

            utils.replaceWithProxy(utils.cache.global, 'Worker', {
                construct: function (target, args) {
                    function getWorkerURL( url ) {
                        const content = `
                        importScripts( ["${ url }"] );
                        `;
                        return URL.createObjectURL( new Blob( [ content ], { type: "text/javascript" } ) );
                    }

                    // console.log(`worker is registered in the browser, ${args[0]}`);
                    const relUrl = window.location.href;
                    const workerUrl = args[0].toString();
                    console.log(this)

                    // fix: The worker's relative path is relative to the current page path.
                    // reference: https://github.com/shehua/Alice/blob/master/w3c/html5-web-workers.md

                    // noinspection LoopStatementThatDoesntLoopJS
                    for (; ;) {
                        if (!workerUrl) {
                            break;
                        }

                        if (
                            workerUrl.includes('://') &&
                            !(
                                workerUrl.startsWith('http://')
                                || workerUrl.startsWith('https://')
                            )
                        ) {
                            break;
                        }

                        // We are bypassing restriction, that cross-origin scripts won't work when requested by worker. Therefore, let's execute it as a blob.
                        args[0] = getWorkerURL(`http://127.0.0.1:${internalHttpServerPort}/patchWorker?type=worker&uuid=${browserUUID}&relUrl=${encodeURIComponent(relUrl)}&workerUrl=${encodeURIComponent(workerUrl)}`);

                        break;
                    }

                    console.log(args)

                    // URL.revokeObjectURL( args[0] );

                    return new workerConstructor.value(...args)
                },
            });
        }

        if ('undefined' !== typeof SharedWorker) {
            const _SharedWorker = SharedWorker;
            const sharedWorkerConstructor = Object.getOwnPropertyDescriptor(
                _SharedWorker.prototype, 'constructor',
            );

            utils.replaceWithProxy(utils.cache.global, 'SharedWorker', {
                construct: function (target, args) {
                    // console.log(`sharedWorker is registered in the browser, ${args[0]}`);
                    const relUrl = window.location.href;
                    const workerUrl = args[0].toString();

                    // noinspection LoopStatementThatDoesntLoopJS
                    for (; ;) {
                        if (!workerUrl) {
                            break;
                        }

                        if (
                            workerUrl.includes('://') &&
                            !(
                                workerUrl.startsWith('http://')
                                || workerUrl.startsWith('https://')
                            )
                        ) {
                            break;
                        }

                        args[0] = `http://127.0.0.1:${internalHttpServerPort}/patchWorker?type=sharedWorker&uuid=${browserUUID}&relUrl=${encodeURIComponent(relUrl)}&workerUrl=${encodeURIComponent(workerUrl)}`;

                        break;
                    }

                    return new sharedWorkerConstructor.value(...args);
                },
            });
        }
    };
}

module.exports = function (pluginConfig) {
    return new Plugin(pluginConfig);
};
