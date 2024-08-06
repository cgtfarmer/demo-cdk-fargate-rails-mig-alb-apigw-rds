import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

interface NetworkStackProps extends StackProps {
}

export class NetworkStack extends Stack {

  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2,
      // Necessary for Security Group rules to enable API GW VPC Link Integrations:
      restrictDefaultSecurityGroup: false,
    });
  }
}

