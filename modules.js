const { paths } = require('./enums')

const getIssues = async (context, repoData) => {
  let issues = await context.github.issues.listForRepo(repoData)
  issues = issues.data.reduce((prev, issue) => ([
    ...prev,
    { id: issue.number, title: issue.title }
  ]), [])
  return issues
}

const getFiles = async (context, repoData) => {
  let path = getPath(context)
  let files = await context.github.repos.getContent({
    ...repoData, ...path
  })
  files = files.data
    .map(file => file.path.split('src/')[1])
    .filter(filename => filename.endsWith('.md'))
    .splice(0, 4) // limit for tests

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

const getPath = (context) => {
  const { comment } = context.payload
  const path = comment.body.split('/CriaIssues')[1]
    .replace('\n', ' ')
    .split(' ')[1]

  if (path && paths.hasOwnProperty(path)) {
    return paths[path]
  } else {
    return { path: 'src/guide' }
  }
}

exports.criaIssues = async (context, repository) => {
  const repo = repository.full_name.split('/');
  const repoData = { owner: repo[0], repo: repo[1] }

  let issues = await getIssues(context, repoData)

  let files = await getFiles(context, repoData)
  let createdIssues = 0

  for (let file of files) {
    const hasIssue = issues.find(issue => issue.title.includes(file))
    if (!hasIssue) {
      await createIssue(context, repoData, file)
      ++createdIssues
    }
  }

  const path = getPath(context).path

  return context.github.issues.createComment(
    context.issue({
      body: `
Opa chefia, analisando arquivos e _issues_ já criadas sobre [${path}](https://github.com/${repo[0]}/${repo[1]}/tree/master/${path}), gerei ${createdIssues} _issues_ dessa vez!
Qualquer coisa só chamar :)`
    })
  )
}

exports.respondFirstTimer = async context => {
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
