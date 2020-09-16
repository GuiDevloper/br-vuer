const getIssues = async (context, repoData) => {
  let issues = await context.github.issues.listForRepo(repoData)
  issues = issues.data.reduce((prev, issue) => ([
    ...prev,
    { id: issue.number, title: issue.title }
  ]), [])
  return issues
}

const getFiles = async (context, repoData) => {
  let files = await context.github.repos.getContent({
    ...repoData, path: 'src/guide'
  })
  files = files.data.map(file => file.path.split('src/')[1]).slice(0, 8)
  return files
}

const createIssue = async (context, repoData, file) => {
  return context.github.issues.create({
    ...repoData,
    title: `Traduzir "${file}"`,
    labels: ['documentation', 'help wanted'],
    body: `Link para o arquivo: [${file.split('.md')[0]}](https://github.com/${repoData.owner}/${repoData.repo}/blob/master/src/${file})`
  })
}

export const criaIssues = async (context, repository) => {
  const repo = repository.full_name.split('/');
  const repoData = { owner: repo[0], repo: repo[1] }

  let issues = await getIssues(context, repoData)

  /* TODO: accept dynamic path args
  let path = comment.body.split('/CriaIssues')[1]
    .replace('\n', ' ')
    .split(' ')[1]
  */

  let files = await getFiles(context, repoData)
  let createdIssues = 0

  for (let file of files) {
    const hasIssue = issues.find(issue => issue.title.includes(file))
    if (!hasIssue) {
      await createIssue(context, repoData, file)
      ++createdIssues
    }
  }

  return context.github.issues.createComment(
    context.issue({
      body: `
Opa chefia, analisando arquivos e _issues_ já criadas sobre [guide](https://github.com/${repo[0]}/${repo[1]}/tree/master/src/guide), gerei ${createdIssues} _issues_ dessa vez!
Qualquer coisa só chamar :)`
    })
  )
}

export const respondFirstTimer = async context => {
  const { user, author_association } = context.payload.issue
  if (user.login !== 'br-vuer[bot]' &&
    user.type !== 'Bot' &&
    author_association.includes('FIRST_TIME')
  ) {
    const issueComment = context.issue({
      body: `
Olá @${user.login}!
Agradecemos por ter aberto esta issue!
Recomendo a leitura dos guias de contribuição e dou as boas vindas :)`
    })
    return context.github.issues.createComment(issueComment)
  }
}
