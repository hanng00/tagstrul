aws cognito-idp describe-user-pool \
  --user-pool-id eu-north-1_1xBAuLEuW \
  --profile enya-test \
  --query 'UserPool.{EmailAuthMsg:EmailAuthenticationMessage,EmailAuthSubj:EmailAuthenticationSubject}'