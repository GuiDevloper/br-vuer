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

      if (comment.body.includes('/CriaIssues')) {
        const repo = repository.full_name.split('/');
        const repoData = { owner: repo[0], repo: repo[1] }
        let issues = await context.github.issues.listForRepo({
          owner: repo[0], repo: repo[1]
        })
        issues = issues.data.reduce((prev, issue) => ([
          ...prev,
          { id: issue.number, title: issue.title }
        ]), [])

        const path = comment.body.split('/CriaIssues')[1].split(' ')[1]
        let files = await context.github.repos.getContent({
          ...repoData,
          path: 'src/' + (path || 'guide')
        })
        files = files.data.map(file => file.path.split('src/')[1]).slice(0, 2)
        for (let file of files) {
          const hasIssue = issues.find(issue => issue.title.includes(file))
          if (!hasIssue) {
            await context.github.issues.create({
              ...repoData,
              title: `Traduzir "${file}"`,
              labels: ['documentation', 'help wanted'],
              body: `Link para arquivo: [${file.split('.md')[0]}](https://github.com/${repo[0]}/${repo[1]}/blob/master/src/${file})`
            })
          }
        }
        app.log.info(files)

        return context.github.issues.createComment(
          context.issue({
            body: 'Aqui está a lista de issues: \n' + issues
          })
        )
      }
    }
  })
}
