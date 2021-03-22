const lighthouse = require('lighthouse');
const launcher = require('chrome-launcher');
const express = require('express');

const lighthouseConstants = require('lighthouse/lighthouse-core/config/constants');

const app = express();
const PORT = 8080;
const HOST = '0.0.0.0';
const baseUrl = "https://www.rev.com";
const endpoints = [
    ["home", "/"],
    ["transcription", "/transcription"],
    ["caption", "/caption"], 
    ["subtitle", "/subtitle"],
    ["enterprise", "/enterprise"],
    ["blog", "/blog"],
    ["freelancers", "/freelancers"],
    ["callrecorder", "/callrecorder"],
    ["voicerecorder", "/voicerecorder"],
    ["about", "/about"]
];

const chromeFlags = [
    '--headless',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-zygote',
    '--no-sandbox',
    '--single-process',
    '--hide-scrollbars'
];

const desktopScreenEmulationConfig = {
    mobile: false,
    width: 360,
    height: 640,
    deviceScaleFactor: 3,
    disabled: false
};

const desktopLighthouseFlags = {
    logLevel: 'info',
    output: ['json'],
    port: undefined,
    formFactor: 'desktop',
    throttling: lighthouseConstants.throttling.desktopDense4G,
    screenEmulation: desktopScreenEmulationConfig,
    emulatedUserAgent: lighthouseConstants.userAgents.desktop,
    onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices']
};

app.get('/lighthouse', (req, res) => {
    launchChromeLighthouse().then(result => res.send(result));
});

app.listen(PORT, HOST);

function printScores(runnerResult) {
    console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);
    console.log('Accessibility score was', runnerResult.lhr.categories.accessibility.score * 100);
    console.log('Best Practices score was', runnerResult.lhr.categories['best-practices'].score * 100);
    console.log('SEO score was', runnerResult.lhr.categories.seo.score * 100);
}

function successResponse(reportJson) {
    return {
        statusCode: 200,
        headers: {
            'Content-Length': JSON.stringify(reportJson).length,
            'Content-Type': 'application/json'
        },
        body: reportJson
    }
}

function errorResponse(error) {
    return {
        statusCode: 500,
        body: error
    }
}

async function runLighthouse(chrome) {
    try {
        desktopLighthouseFlags.port = chrome.port;
        const homeIndex = 0;
        const runnerResult = await lighthouse(baseUrl + endpoints[homeIndex][1], desktopLighthouseFlags);
        printScores(runnerResult);
        return successResponse(runnerResult.lhr);
    } catch(error) {
        return errorResponse(error);
    } finally {
        await chrome.kill();
    }
}

async function launchChromeLighthouse() {
    const chrome = await launcher.launch({chromeFlags: chromeFlags});
    return await runLighthouse(chrome);
}