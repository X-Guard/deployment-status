import * as core from "@actions/core";
import * as github from "@actions/github";

type Deployment =
  | "production"
  | "staging"
  | "qa"

type DeploymentState =
  | "error"
  | "failure"
  | "inactive"
  | "in_progress"
  | "queued"
  | "pending"
  | "success";

function hashCode(str: string): number {
  let hash: number = 0;
  let chr: number;

  if (str.length === 0) return hash;

  for (let i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}

async function run() {
  try {
    const context = github.context;
    const defaultLogUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

    const token = core.getInput("token", { required: true });
    const logUrl = core.getInput("log_url", { required: false }) || core.getInput("target_url", { required: false }) || defaultLogUrl;
    const description = core.getInput("description", { required: false }) || "";
    const usrDeploymentId = core.getInput("deployment_id");
    const environment = core.getInput("environment", { required: false }) as Deployment;
    const environmentUrl = core.getInput("environment_url", { required: false }) || "";
    const state = (core.getInput("state") || "in_progress") as DeploymentState;

    const client = new github.GitHub(token, { previews: ["flash", "ant-man"] });

    const deploymentId = usrDeploymentId
        ? parseInt(usrDeploymentId)
        : hashCode(context.sha)

    await client.repos.createDeploymentStatus({
      ...context.repo,
      deployment_id: deploymentId,
      state,
      log_url: logUrl,
      description,
      environment: environment || undefined,
      environment_url: environmentUrl,
    });
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
