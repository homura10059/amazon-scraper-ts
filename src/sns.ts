import { PublishInput } from 'aws-sdk/clients/sns'
import AWS from 'aws-sdk'

export const publish = (input: PublishInput) => {
  const publisher = getSnsPublisher()
  return publisher.publish(input).promise()
}

const getSnsPublisher = (() => {
  let publisher: AWS.SNS | null = null

  return () => {
    if (!publisher) {
      AWS.config.update({ region: 'ap-northeast-1' })
      publisher = new AWS.SNS({ apiVersion: '2010-03-31' })
    }
    return publisher
  }
})()
