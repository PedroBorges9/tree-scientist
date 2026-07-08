# AWS Deployment

This calculator is a static site, so the simplest AWS setup is:

- S3 bucket for the website files.
- Optional CloudFront distribution for HTTPS, CDN caching, and a cleaner production setup.
- GitHub Actions deployment using AWS OIDC, so no long-lived AWS access keys are stored in GitHub.

## AWS setup

1. Create an S3 bucket, for example `tree-scientist-site`.
2. If using S3 website hosting directly, enable static website hosting and set `index.html` as the index document.
3. For HTTPS, create a CloudFront distribution with the S3 bucket as the origin.
4. In IAM, add the GitHub Actions OIDC identity provider:
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
5. Create an IAM role trusted by this repository.

Trust policy, replacing the account id if needed:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:PedroBorges9/tree-scientist:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

Attach a policy like this to the role, replacing the bucket name and CloudFront distribution ARN:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::tree-scientist-site"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::tree-scientist-site/*"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::<AWS_ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
    }
  ]
}
```

If you are not using CloudFront, remove the CloudFront statement.

## GitHub repository settings

In GitHub, go to Settings -> Secrets and variables -> Actions.

Add this repository secret:

- `AWS_ROLE_TO_ASSUME`: the ARN of the IAM role, for example `arn:aws:iam::123456789012:role/tree-scientist-github-actions`

Add these repository variables:

- `AWS_REGION`: for example `eu-west-2`
- `AWS_S3_BUCKET`: your bucket name, for example `tree-scientist-site`
- `CLOUDFRONT_DISTRIBUTION_ID`: optional. Leave unset or blank if not using CloudFront.

## Deployment flow

The workflow in `.github/workflows/deploy-aws.yml` runs on every push to `main` and can also be run manually.

It deploys only:

- `index.html`
- `assets/`
- `src/`
- `data/`

It does not deploy `reference/`, local PDFs, source workbooks, or the portable zip.
