/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  // Your code here
  app.log.info('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({
      body: `
Agradecemos por ter aberto esta issue!
Recomendo a leitura de nosso guia de conduta e seja bem vindo :)
      `
    })
    return context.github.issues.createComment(issueComment)
  })

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
      /*
      const issueComment = context.issue({
        body: `
Olá @${comment.user.login}, ${comment.author_association} de [${repository.full_name}](${repository.html_url})
Gostei da sua mensagem: ${comment.body}
        `
      })
      */

      if (comment.body.includes('/ListaIssues')) {
        const repo = repository.full_name.split('/');
        let issues = await context.github.issues.listForRepo({
          owner: repo[0], repo: repo[1]
        })
        issues = issues.data.reduce((prev, issue) => (
          prev + `id: ${issue.number}, title: ${issue.title}\n`
        ), '')
        let files = await context.github.repos.getContent({
          owner: repo[0], repo: repo[1],
          path: 'src/guide'
        })
        files = files.map(file => file.path)
        app.log.info(files);

        return context.github.issues.createComment(
          context.issue({
            body: 'Aqui está a lista de issues: \n' + issues
          })
        )
      }
    }
  })
}
