# CDK Fargate Rails ALB APIGW RDS

This is a demo showing how to deploy a Rails API with CRUD functionality to Fargate, behind an API Gateway (HTTP API), backed by an RDS database instance (accessed with RDS Proxy). DB credentials are managed by Secrets Manager and injected into the container. Database schema migrations are managed via Liquibase in a TriggerFunction construct.

## Prerequisites

- Docker
- Node 18+
- awscli


## Installation

1. Clone this repository

2. Install Bundler dependencies

`bundle install`


## Deploy

1. Deploy Network Stack

`cdk deploy NetworkStack`

2. Deploy DB Stack

`cdk deploy DbStack`

3. Deploy DB Migration Stack

`cdk deploy DbMigrationStack`

4. Deploy API Stack

`cdk deploy ApiStack`
