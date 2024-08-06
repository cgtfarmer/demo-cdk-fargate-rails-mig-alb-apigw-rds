import { Construct } from 'constructs';
import { Duration, Size, Stack, StackProps } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpAlbIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { InstanceClass, InstanceSize, InstanceType, Port, Vpc } from 'aws-cdk-lib/aws-ec2';
import { DatabaseProxy } from 'aws-cdk-lib/aws-rds';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AwsLogDriverMode, Cluster, FargateService, FargateTaskDefinition, LogDrivers, Protocol, Secret as EcsSecret, AssetImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

interface ApiStackProps extends StackProps {
  vpc: Vpc;

  rdsProxy: DatabaseProxy;

  rdsSecret: ISecret;

  rdsPort: string;

  rdsDbName: string;
}

export class ApiStack extends Stack {

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const railsSecretKeyBaseSecret = new Secret(this, 'RailsSecretKeyBaseSecret', {
      generateSecretString: {
        excludeUppercase: true,
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 129,
        requireEachIncludedType: true
      }
    });

    const cluster = new Cluster(this, 'Cluster', {
      vpc: props.vpc,
      capacity: {
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.NANO),
        desiredCapacity: 2,
        maxCapacity: 2,
      }
    });

    const taskDefinition = new FargateTaskDefinition(this, 'TaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    const appPort = 3000;

    taskDefinition.addContainer('DefaultContainer', {
      image: AssetImage.fromAsset('src/user-service', {
        // References: Dockerfile "FROM (...) AS <target-name>"
        target: 'production',
      }),
      memoryLimitMiB: 1024,
      logging: LogDrivers.awsLogs({
        streamPrefix: 'TestStreamPrefix',
        mode: AwsLogDriverMode.NON_BLOCKING,
        maxBufferSize: Size.mebibytes(25),
        logRetention: RetentionDays.ONE_WEEK,
      }),
      // Note: hostPort will be the same as containerPort due to AwsVpc Docker network mode
      portMappings: [ { containerPort: appPort, protocol: Protocol.TCP, } ],
      healthCheck: {
        command: [ "CMD-SHELL", `curl -f http://localhost:${appPort}/health || exit 1` ],
        interval: Duration.minutes(1),
        retries: 3,
        startPeriod: Duration.minutes(2),
        timeout: Duration.minutes(1),
      },
      environment: {
        RAILS_ENV: 'production',
        PORT: appPort.toString(),
        BUNDLE_PATH: '/usr/local/bundle',
        DB_HOST: props.rdsProxy.endpoint,
        DB_PORT: props.rdsPort,
        DB_DATABASE: props.rdsDbName,
      },
      secrets: {
        DB_SECRET: EcsSecret.fromSecretsManager(props.rdsSecret),
        SECRET_KEY_BASE: EcsSecret.fromSecretsManager(railsSecretKeyBaseSecret),
        // PARAMSTORE_SECRET: EcsSecret.fromSsmParameter(parameter),
      }
    });

    const fargateService = new FargateService(this, 'FargateService', {
      cluster,
      taskDefinition,
      assignPublicIp: false,
      desiredCount: 2,
      healthCheckGracePeriod: Duration.minutes(2),
    });

    // This direction is incorrect due to causing cyclic dependencies
    // props.rdsProxy.connections.allowFrom(demoLambda, Port.POSTGRES);
    fargateService.connections.allowTo(props.rdsProxy, Port.POSTGRES);

    const alb = new ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      vpc: props.vpc,
      internetFacing: false,
    });

    const listener = alb.addListener('AlbListener', { port: 80 });
    listener.addTargets('target', {
      port: appPort,
      protocol: ApplicationProtocol.HTTP,
      targets: [ fargateService ],
      healthCheck: {
        path: '/health',
        interval: Duration.minutes(2),
        timeout: Duration.minutes(1),
      }
    });

    const httpAlbIntegration = new HttpAlbIntegration('DefaultIntegration', listener);

    const httpApi = new HttpApi(this, 'HttpApi', {
      createDefaultStage: false,
      corsPreflight: {
        allowHeaders: ['Authorization'],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: ['*'],
        maxAge: Duration.days(10),
      },
    });

    httpApi.addStage('DefaultStage', {
      stageName: '$default',
      autoDeploy: true,
      throttle: {
        burstLimit: 2,
        rateLimit: 1,
      }
    });

    httpApi.addRoutes({
      path: '/users',
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: httpAlbIntegration,
    });

    httpApi.addRoutes({
      path: '/users/{id}',
      methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      integration: httpAlbIntegration,
    });
  }
}
