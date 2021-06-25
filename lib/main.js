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
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            const defaultLogUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;
            const token = core.getInput("token", { required: true });
            const logUrl = core.getInput("log_url", { required: false }) || core.getInput("target_url", { required: false }) || defaultLogUrl;
            const description = core.getInput("description", { required: false }) || "";
            const usrDeploymentId = core.getInput("deployment_id");
            const environment = core.getInput("environment", { required: false });
            const environmentUrl = core.getInput("environment_url", { required: false }) || "";
            const state = (core.getInput("state") || "in_progress");
            const client = new github.GitHub(token, { previews: ["flash", "ant-man"] });
            const deploymentId = usrDeploymentId
                ? parseInt(usrDeploymentId)
                : hashCode(context.sha);
            yield client.repos.createDeploymentStatus(Object.assign({}, context.repo, { deployment_id: deploymentId, state, log_url: logUrl, description, environment: environment || undefined, environment_url: environmentUrl }));
        }
        catch (error) {
            core.error(error);
            core.setFailed(error);
        }
    });
}
run();
