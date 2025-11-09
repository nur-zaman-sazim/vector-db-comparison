## Installation

Make sure you have `nvm` installed. Then, run the following commands:

```bash
$ nvm use
```
We use Node v20 by default.

We use `yarn` (v1) as our package manager. After using `nvm` to change to the proper node version, run the following command to install `yarn`

```bash
npm i -g yarn
```

To install the dependencies, run the following command:

```bash
$ yarn install
```
## Environment Variables
For local development and testing, please create the following files at the root of the project directory:

- `env.development.local`
- `env.test.local`

You can follow `env.example` to specify which env variables are needed for the project as a guideline, and the above two files can be created based off of this file.

### Environment Variables Validation
We use `class-validator` to validate env files before the server starts up to avoid any cases of missing environment variables. They are tracked in these two files.
- `src/common/interfaces/environment-variables.interface.ts`
- `src/common/validators/env.validator.ts`

When adding new environment variables, please add them to these files so that your project can remain functional through environment variable changes.

## Template Modules
The template contains code that might not be relevant for your project's needs. Such modules might include:
- PDF generation
- Document signing

If not needed, please remove the said modules from the code when your initiating your project. Make sure to remove any irrelevant environment variables as well by modifying `src/common/interfaces/environment-variables.interface.ts` and `src/common/validators/env.validator.ts` files.

## Conventions

Follow our [NestJS Conventions Doc](https://docs.google.com/document/d/1fBH7IJOy8ugQIxN64gHjv50Mn1cj2ZiqOYm4niP_WQU/edit) for guidelines

## Localstack

We depend on localstack for local development to test out our integration with the S3 object storage. To set it up, make sure that your machine has:

- [Docker](https://docs.docker.com/desktop/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

Now, you have to configure an AWS profile. Run the following command and enter dummy values for access key id and secret:

```bash
aws configure --profile localstack_dev

AWS Access Key ID []: foo 
AWS Secret Access Key []: bar
Default region name []: us-east-1
Default output format []: json

```

Next, make sure your localstack instance is running via `docker compose`

```bash
docker compose -f ./docker-compose.local.yml up
```

Verify that the bucket was created using:

```bash
AWS_PROFILE=localstack_dev aws --endpoint-url=http://localhost:4566 s3api list-buckets
```

You should see this output:

```
{
    "Buckets": [
        {
            "Name": "project-dev-bucket",
            "CreationDate": "2024-01-04T15:56:22+00:00"
        }
    ],
    "Owner": {
        "DisplayName": "webfile",
        "ID": "75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a"
    }
}
```


## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

When using localstack, please explicitly set your `AWS_PROFILE` variable in your shell configuration file, or write all commands like the following:

```
AWS_PROFILE=localstack_dev yarn run start:dev 
```

## Database Migrations

The `dev` database is used during development and `test` database is used for running tests. 

```bash
# Drop all tables, run all migrations, seed the db
$ yarn run db:migration:fresh:dev

# Migrate up to latest
$ yarn run db:migration:up:dev

# Migrate down by one
$ yarn run db:migration:down:dev

# Create a new migration file (requires --name) (use --blank to skip autogeneration)
$ yarn run db:migration:create

# Seed database with local variables. You must pass in the class name
$ yarn run db:seed:local --class="ExampleSeederClass"

# Run all migrations and seeding with test variables
$ yarn run db:migration:fresh:test
```

## Commit Convention
``subject(ticket-code): message``

Valid subjects:
``build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test``

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Docker Deployment

### Certificate Handling
For production deployments that require SSL certificates (e.g., for managed database connections), you can mount your certificates directory using the `CERTS_PATH` environment variable.

## Build Actions (Local)
### Running Build Actions with the Script
- We have included a script (test-lint.sh) in the root directory to streamline the process of linting and testing the project.
- To use the script, follow these steps:

  1. Ensure the script is executable. If not, make it executable by running:
     ```bash
     chmod +x ./test-lint.sh
     ```
  2. If you don't use tmux, skip to the next step.
     - If you do use tmux, make sure you run this script outside any other tmux sessions
  3. Run the script:
     ```bash
     ./test-lint.sh
     ```
     This will:
       - Start a new tmux session named `test-lint`.
       - Open three panes:
         - Pane 1: Executes e2e tests.
         - Pane 2: Runs lint checks.
         - Pane 3: Executes unit tests.
  4. Once the actions are complete, you can:
     - Manually check the output in each pane for any errors or failures.
     - If necessary, take screenshot of the screen and attach the screenshot to your pull request (PR).

## Audit Logging

Audit Logging is available as a feature in this repository. All database create/update/delete actions are logged in the `audit_logs` table. For this to work, we adopt the following approach:

1. We control whether audit logging is enabled by using `ENABLE_AUDIT_LOGGING` environment variable.

2. `AuditLoggingSubscriber` is an event subscriber for Mikro ORM that listens for `onFlush` events. This is added to the `src/app.module.ts` file.

3. `AuditLoggingSubscriberCreatorInterceptor` is registered as one of the global interceptors in `main.ts`, which is responsible for setting the logged in user in the `AuditLoggingSubscriber` context. Interceptors resolve after middlewares and guards resolve, and in our application, guards are responsible for attaching the user object to the request object after validating the access token.
