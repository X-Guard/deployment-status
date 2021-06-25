"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const axios_1 = __importDefault(require("axios"));
const ax = axios_1.default.create();
function hashCode(str) {
    let hash = 0;
    let chr;
    if (str.length === 0)
        return hash;
    for (let i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
function mrkdwn(message) {
    return {
        type: "section",
        text: {
            type: 'mrkdwn',
            text: message
        }
    };
}
function sendMessage(webhookUrl, args) {
    return __awaiter(this, void 0, void 0, function* () {
        let color;
        function getMainSection() {
            switch (args.state) {
                case 'success':
                    color = '#219e46';
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
                        image_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
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
        const message = {
            attachments: [{
                    color,
                    blocks
                }]
        };
        console.log(JSON.stringify(message));
        yield ax.post(webhookUrl, message);
    });
}
exports.sendMessage = sendMessage;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            const webhook_url = core.getInput("webhook_url", { required: true });
            const failure = core.getInput("failure", { required: true });
            const success = core.getInput("success", { required: true });
            const env = core.getInput("env", { required: true });
            const envUrl = core.getInput("env_url", { required: false });
            const dashboardUrl = core.getInput("dashboard_url", { required: false });
            const state = failure ? "failure" : success ? "success" : "cancelled";
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
            console.log(JSON.stringify(args, null, 2));
            return;
            yield sendMessage(webhook_url, args);
        }
        catch (error) {
            core.error(error);
            core.setFailed(JSON.stringify(error, null, 2));
        }
    });
}
run();
