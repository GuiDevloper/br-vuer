/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.on('issues.opened', async context => {
    const { user, author_association } = context.payload.issue
    if (user.login !== 'br-vuer[bot]' &&
      user.type !== 'Bot' &&
      author_association.includes('FIRST_TIME')
    ) {
      const issueComment = context.issue({
        body: `
Olá @${user.login}!
Agradecemos por ter aberto esta issue!
Recomendo a leitura dos guias de contribuição e dou as boas vindas :)
        `
      })
      return context.github.issues.createComment(issueComment)
    }
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

        /* TODO: accept dynamic path args
        let path = comment.body.split('/CriaIssues')[1]
          .replace('\n', ' ')
          .split(' ')[1]
        */

        let files = await context.github.repos.getContent({
          ...repoData, path: 'src/guide'
        })
        files = files.data.map(file => file.path.split('src/')[1]).slice(0, 4)

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
            body: 'Aqui está a lista de issues: \n' + issues.map(v => (
              `id: ${v.id}, title: ${v.title}`
            )).join('\n')
          })
        )
      }
    }
  })
}
