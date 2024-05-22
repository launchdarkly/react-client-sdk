import { LDOptions } from 'launchdarkly-js-client-sdk';
import * as packageInfo from '../package.json';

const wrapperOptions: LDOptions = {
  wrapperName: 'react-client-sdk',
  wrapperVersion: packageInfo.version,
  sendEventsOnlyForVariation: true,
};

export default wrapperOptions;
