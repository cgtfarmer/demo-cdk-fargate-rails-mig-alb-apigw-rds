#!/usr/bin/env node

import { App } from 'aws-cdk-lib';

import { NetworkStack } from '../cdk/lib/stacks/network-stack';
import { DbStack } from '../cdk/lib/stacks/db-stack';
import { ApiStack } from '../cdk/lib/stacks/api-stack';

const app = new App();

const networkStack = new NetworkStack(app, 'NetworkStack', {});

const dbStack = new DbStack(app, 'DbStack', {
  vpc: networkStack.vpc,
});

const apiStack = new ApiStack(app, 'ApiStack', {
  vpc: networkStack.vpc,
  rdsProxy: dbStack.rdsProxy,
  rdsSecret: dbStack.rdsSecret,
  rdsPort: dbStack.rdsPort,
  rdsDbName: dbStack.rdsDbName,
});
