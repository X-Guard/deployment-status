"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const axios_1 = __importDefault(require("axios"));
const ax = axios_1.default.create();
/**
 * Create a slack markdown section
 *
 * @param message
 */
function mrkdwn(message) {
    return {
        type: "section",
        text: {
            type: 'mrkdwn',
            text: message
        }
    };
}
/**
 * Sends a formatted message to a slack channel using the given webhook url
 *
 * @param webhookUrl - Secret Slack webhook url
 * @param args - Arguments to format the message
 */
function sendMessage(webhookUrl, args) {
    return __awaiter(this, void 0, void 0, function* () {
        // Color for the main attachment. Used to show the deployment state. Defaults to grey if undefined
        let color;
        function getMainSection() {
            switch (args.state) {
                case 'success':
                    color = '#28d4d9';
                    return mrkdwn(`Successfully deployed *${args.repoName}* to <${args.envUrl}|${args.env} environment>`);
                case 'failure':
                    color = '#ff343f';
                    return mrkdwn(`Failed to deploy *${args.repoName}* to <${args.envUrl}|${args.env} environment>`);
                case 'cancelled':
                    return mrkdwn(`Cancelled deployment of *${args.repoName}* to <${args.envUrl}|${args.env} environment>`);
            }
        }
        function getExtraInfo(links) {
            links = links.filter(({ url }) => url);
            function join() {
                // Oxford comma join
                return links.map(({ name, url }) => `<${url}|${name}>`).join(', ').replace(/, ([^,]*)$/, ' and $1');
            }
            switch (links.length) {
                case 0:
                    return `no extra info provided`;
                default:
                    return `view the ${join()} for extra information`;
            }
        }
        function getInfoSection() {
            const extraInfo = getExtraInfo([
                { name: 'Logs', url: args.logUrl },
                { name: 'Dashboard', url: args.dashboardUrl },
            ]);
            return mrkdwn(`Ref: <${args.refUrl}|${args.refName}>, ${extraInfo}`);
        }
        function getContextSection() {
            return {
                type: 'context',
                elements: [{
                        type: 'image',
                        image_url: 'https://slack.github.com/static/img/favicon-neutral.png',
                        alt_text: 'Github'
                    }, {
                        type: 'mrkdwn',
                        text: `<${args.repoUrl}|${args.repoName}>`
                    }]
            };
        }
        const blocks = [
            getMainSection(),
            getInfoSection(),
            getContextSection()
        ];
        yield ax.post(webhookUrl, {
            attachments: [{
                    color,
                    blocks
                }]
        });
    });
}
exports.sendMessage = sendMessage;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            const webhook_url = core.getInput("webhook_url", { required: true });
            const state = core.getInput("state", { required: true });
            const env = core.getInput("env", { required: true });
            const envUrl = core.getInput("env_url", { required: false });
            const dashboardUrl = core.getInput("dashboard_url", { required: false });
            const repoName = context.repo.repo;
            const repoUrl = `https://github.com/${context.repo.owner}/${repoName}`;
            const refName = context.ref;
            const refUrl = `${repoUrl}/commit/${context.sha}`;
            const logUrl = `${refUrl}/checks`;
            const args = {
                env,
                envUrl,
                state,
                repoName,
                repoUrl,
                refName,
                refUrl,
                logUrl,
                dashboardUrl,
            };
            yield sendMessage(webhook_url, args);
        }
        catch (error) {
            core.error(error);
            core.setFailed(JSON.stringify(error, null, 2));
        }
    });
}
run();
