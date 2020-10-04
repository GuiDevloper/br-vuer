const {
  criaIssues,
  respondFirstTimer,
  deleteIssues
} = require('./modules')
const { associations } = require('./enums')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.on('issues.opened', respondFirstTimer)

  app.on('issue_comment', async context => {
    const { action, comment, repository } = context.payload

    if (
      associations.includes(comment.author_association) &&
      action === 'created'
    ) {
      const body = comment.body.toLowerCase()

      if (body.includes('/criaissues')) {
        await criaIssues(context, repository)
      }

      if (body.includes('/deleteissues')) {
        // deleteIssues(context, repository)
      }
    }
  })
}
