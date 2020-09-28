const { paths, deleteIssueMutation } = require('./enums')

const getIssues = async (context, repoData, page) => {
  let issues = await context.github.issues.listForRepo({
    ...repoData,
    per_page: 100, page
  })
  issues = issues.data.reduce((prev, issue) => ([
    ...prev,
    { id: issue.number, title: issue.title }
  ]), [])
  return issues
}

const getAllIssues = async (context, repoData) => {
  let issues = await getIssues(context, repoData, 1)

  // get possible second page of 100 issues
  let moreIssues = await getIssues(context, repoData, 2)
  if (moreIssues.length > 0) {
    issues = [...issues, ...moreIssues]
  }
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

const getCommentArg = (context, fnName) => {
  const { comment } = context.payload
  return comment.body
    .toLowerCase()
    .split(fnName)[1]
    .replace('\n', ' ')
    .split(' ')[1]
}

const getPath = (context) => {
  const path = getCommentArg(context, '/criaissues')

  if (path && paths.hasOwnProperty(path)) {
    return paths[path]
  } else {
    return { path: 'src/guide' }
  }
}

const getRepoData = (repository) => {
  const repo = repository.full_name.split('/')
  return { owner: repo[0], repo: repo[1] }
}

const createComment = (context, body) => {
  return context.github.issues.createComment(
    context.issue({ body })
  )
}

exports.criaIssues = async (context, repository) => {
  const repoData = getRepoData(repository)

  let issues = await getAllIssues(context, repoData)

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

  return createComment(context, `
Opa chefia, analisando arquivos e _issues_ já criadas sobre [${path}](https://github.com/${repo[0]}/${repo[1]}/tree/master/${path}), gerei ${createdIssues} _issues_ dessa vez!
Qualquer coisa só chamar :)`
  )
}

exports.respondFirstTimer = async context => {
  const { user, author_association } = context.payload.issue
  if (user.login !== 'br-vuer[bot]' &&
    user.type !== 'Bot' &&
    author_association.includes('FIRST_TIME')
  ) {
    return createComment(context, `
Olá @${user.login}!
Agradecemos por ter aberto esta issue!
Recomendo a leitura dos guias de contribuição e dou as boas vindas :)`
    )
  }
}

exports.deleteIssues = async (context, repository) => {
  const repoData = getRepoData(repository)

  const arg = getCommentArg(context, '/deleteissues')
  if (!arg) return true

  let issues = await getAllIssues(context, repoData)
  let deletedIssues = 0

  for (let issue of issues) {
    if (issue.title.includes(`${arg}/`)) {
      await context.github.graphql(deleteIssueMutation, {
        issueId: issue.node_id
      })
      ++deletedIssues
    }
    if (deletedIssues > 3) break
  }

  return createComment(context, `
Ô meu array, analisando _issues_ sobre ${arg}, removi ${deletedIssues} _issues_!
Qualquer coisa só chamar :)`
  )
}
