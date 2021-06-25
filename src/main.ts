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

export type MessageArgs = {
  /**
   * Environment of the service
   */
  env: DeploymentEnv,

  /**
   * Actual url of the deployed service
   */
  envUrl: string,

  /**
   * State of the deployment, either failed or succeeded
   */
  state: DeploymentState,

  /**
   * Url of the source repository
   */
  repoUrl: string,

  /**
   * Display name of the repository
   */
  repoName: string,

  /**
   * Ref of the deployment
   */
  refName: string,

  /**
   * Github url of the ref. Usually links to the commit that created the deployment
   */
  refUrl: string,

  /**
   * Github checks of the deployments. From here, deployment action is visible
   */
  logUrl?: string,

  /**
   * Url of dashboard of the deployed service. Usually a cloud run dashboard link
   */
  dashboardUrl?: string,
}

/**
 * Create a slack markdown section
 *
 * @param message
 */
function mrkdwn(message: string): object {
  return {
    type: "section",
    text: {
      type: 'mrkdwn',
      text: message
    }
  }
}

/**
 * Sends a formatted message to a slack channel using the given webhook url
 *
 * @param webhookUrl - Secret Slack webhook url
 * @param args - Arguments to format the message
 */
export async function sendMessage(webhookUrl: string, args: MessageArgs) {

  // Color for the main attachment. Used to show the deployment state. Defaults to grey if undefined
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
        image_url: 'https://slack.github.com/static/img/favicon-neutral.png',
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
