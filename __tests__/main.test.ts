import Axios from 'axios';
const ax = Axios.create();
import { webhookUrl } from '../secrets';
import { sendMessage } from '../src/main';


describe('TODO - Add a test suite', () => {
  it('TODO - Add a test', async () => {
    await sendMessage(webhookUrl, {
      env: 'production',
      envUrl: 'https://github.com/X-Guard/deployment-status/releases/tag/1.2.0',
      state: 'failure',
      repoUrl: 'https://github.com/X-Guard/deployment-status',
      repoName: 'deployment-status',
      refName: '#dd59568',
      refUrl: 'https://github.com/X-Guard/deployment-status/commit/dd595687fee8fcd78cb5c7a2255236302f6d1da5',
      logUrl: 'https://github.com/X-Guard/deployment-status/actions/runs/970630124',
    })
  });
});
