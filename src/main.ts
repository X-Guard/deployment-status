import * as core from "@actions/core";
import * as github from "@actions/github";
import Axios from 'axios';
const ax = Axios.create();

type DeploymentEnv =
  | "production"
  | "staging"
  | "qa"

type DeploymentState =
  | "failure"
  | "success"
  | "cancelled"

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

export type MessageArgs = {
  env: DeploymentEnv,
  envUrl: string,
  state: DeploymentState,
  repoUrl: string,
  repoName: string,
  refName: string,
  refUrl: string,
  logUrl?: string,
  dashboardUrl?: string,
}

function mrkdwn(message): object {
  return {
    type: "section",
    text: {
      type: 'mrkdwn',
      text: message
    }
  }
}

export async function sendMessage(webhookUrl: string, args: MessageArgs) {

  let color: string | undefined;

  function getMainSection() {
    switch (args.state) {
      case 'success':
        color = '#219e46'
        return mrkdwn(`Successfully deployed *${args.repoName}* to <${args.envUrl}|${args.env} environment>`);
      case 'failure':
        color = '#ff343f'
        return mrkdwn(`Failed to deploy *${args.repoName}* to <${args.envUrl}|${args.env} environment>`);
      case 'cancelled':
        return mrkdwn(`Cancelled deployment of *${args.repoName}* to <${args.envUrl}|${args.env} environment>`);
    }
  }

  function getExtraInfo(links: { name: string, url: string | undefined }[]): string {
    links = links.filter(({ url }) => url);

    function join(): string {
      // Oxford comma join
      return links.map(({ name, url }) => `<${url}|${name}>`).join(', ').replace(/, ([^,]*)$/, ' and $1')
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
    }
  }

  const blocks = [
    getMainSection(),
    getInfoSection(),
    getContextSection()
  ]

  await ax.post(webhookUrl, {
    attachments: [{
      color,
      blocks
    }]
  });
}


async function run() {
  try {
    const context = github.context;

    const webhook_url = core.getInput("webhook_url", { required: true });
    const state = core.getInput("state", { required: true }) as DeploymentState;
    const env = core.getInput("env", { required: true }) as DeploymentEnv;
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
    }

    await sendMessage(webhook_url, args)

  } catch (error) {
    core.error(error);
    core.setFailed(JSON.stringify(error, null, 2));
  }
}

run();
