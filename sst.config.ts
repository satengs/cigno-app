// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "cigno-platform",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "eu-west-1" // EU West 1 (Ireland) for EMEA Financial Services
        }
      }
    };
  },
  async run() {
    // Create VPC for the Cigno Platform container infrastructure
    const cignoVpc = new sst.aws.Vpc("CignoVpc");
    
    // Create ECS Cluster for running Cigno Platform containers
    const cignoCluster = new sst.aws.Cluster("CignoCluster", { 
      vpc: cignoVpc 
    });

    // Create S3 Bucket for Cigno Platform file uploads with public access
    const cignoAssets = new sst.aws.Bucket("CignoAssets", {
      access: "public"
    });

    // Create containerized Cigno Platform service using Fargate
    const cignoService = new sst.aws.Service("CignoService", {
      cluster: cignoCluster,
      loadBalancer: {
        ports: [{ listen: "80/http", forward: "3000/http" }],
      },
      dev: {
        command: "npm run dev",
      },
      image: {
        dockerfile: "Dockerfile",
        context: ".",
      },
      environment: {
        MONGODB_URI: process.env.MONGODB_URI || "",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
        NODE_ENV: process.env.NODE_ENV || "production",
        LLM_PROVIDER: process.env.LLM_PROVIDER || "openai",
        ALLOW_EXTERNAL_AI: process.env.ALLOW_EXTERNAL_AI || "false",
      },
      link: [cignoAssets],
    });

    return {
      url: cignoService.url,
      bucketName: cignoAssets.name,
      region: "eu-west-1",
      stage: $app.stage,
      cluster: cignoCluster.name,
      vpc: cignoVpc.id,
    };
  },
});
