import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseInstance, DatabaseInstanceEngine, DatabaseProxy, PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';
import { InstanceClass, InstanceSize, InstanceType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

interface DbStackProps extends StackProps {
  vpc: Vpc;
}

export class DbStack extends Stack {

  public readonly rdsProxy: DatabaseProxy;

  public readonly rdsSecret: ISecret;

  public readonly rdsPort: string;

  public readonly rdsDbName: string;

  constructor(scope: Construct, id: string, props: DbStackProps) {
    super(scope, id, props);

    // V1 - EOL - don't use
    // this.rdsCluster = new ServerlessCluster(this, 'AnotherCluster', {
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
    //   vpc: props.vpc,
    //   scaling: {
    //     autoPause: Duration.minutes(5),
    //     minCapacity: AuroraCapacityUnit.ACU_1,
    //     maxCapacity: AuroraCapacityUnit.ACU_1,
    //     timeout: Duration.seconds(100),
    //     timeoutAction: TimeoutAction.FORCE_APPLY_CAPACITY_CHANGE
    //   }
    // });

    // V2 - expeeeensive
    // const cluster = new DatabaseCluster(this, 'RdsCluster', {
    //   vpc: props.vpc,
    //   engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
    //   serverlessV2MinCapacity: 0.5,
    //   serverlessV2MaxCapacity: 0.5,
    //   storageType: DBClusterStorageType.AURORA,
    // });

    // cluster.addProxy('RdsClusterProxy', {
    //   vpc: props.vpc,
    //   secrets: [cluster.secret],
    //   borrowTimeout: Duration.seconds(30),
    //   debugLogging: true,
    // });

    this.rdsDbName = 'postgres';

    const rdsInstance = new DatabaseInstance(this, 'RdsInstance', {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_15,
      }),
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      vpc: props.vpc,
      allocatedStorage: 10,
      maxAllocatedStorage: 10,
      // iops: 1000,
      backupRetention: Duration.days(0),
      databaseName: this.rdsDbName,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    if (!rdsInstance.secret) throw new Error('RDS instance secret is undefined');

    this.rdsSecret = rdsInstance.secret;

    this.rdsPort = rdsInstance.dbInstanceEndpointPort;

    this.rdsProxy = rdsInstance.addProxy('RdsProxy', {
      secrets: [rdsInstance.secret],
      // debugLogging: true,
      vpc: props.vpc,
    });
  }
}
