const { criaIssues, respondFirstTimer } = require('./modules')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.on('issues.opened', respondFirstTimer)

  app.on('issue_comment', async context => {
    const { action, comment, repository } = context.payload
    const associations = [
      'OWNER',
      'MEMBER',
      'COLLABORATOR'
    ]

    if (
      associations.includes(comment.author_association) &&
      action === 'created'
    ) {
      if (comment.body.toLowerCase().includes('/criaissues')) {
        criaIssues(context, repository)
      }
    }
  })
}
